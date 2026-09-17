const fs = require("fs");
const path = require("path");
const { z } = require("zod");
const CDP = require("chrome-remote-interface");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

const ROOT_DIR = path.join(__dirname, "..");
const RULES_PATH = path.join(ROOT_DIR, "rules.json");
const DEBUG_PORT = Number(process.env.TV_DEBUG_PORT || 9222);

function loadRules() {
  const raw = fs.readFileSync(RULES_PATH, "utf-8");
  return JSON.parse(raw);
}

async function withPage(fn) {
  const client = await CDP({ port: DEBUG_PORT });
  try {
    const { Page, Runtime } = client;
    await Page.enable();
    return await fn(client, { Page, Runtime });
  } finally {
    await client.close();
  }
}

const server = new McpServer({
  name: "claudeverstradingview",
  version: "1.0.0",
});

server.tool(
  "get_rules",
  "Retourne la configuration de trading actuelle depuis rules.json",
  {},
  async () => ({
    content: [{ type: "text", text: JSON.stringify(loadRules(), null, 2) }],
  })
);

server.tool(
  "evaluate_js",
  "Exécute une expression JavaScript dans la page TradingView ouverte (via Chrome DevTools Protocol) et retourne le résultat.",
  { expression: z.string().describe("Expression JavaScript à évaluer dans la page") },
  async ({ expression }) => {
    const result = await withPage(async (_client, { Runtime }) => {
      const { result, exceptionDetails } = await Runtime.evaluate({
        expression,
        returnByValue: true,
      });
      if (exceptionDetails) {
        throw new Error(exceptionDetails.text || "Erreur d'évaluation JS");
      }
      return result.value;
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

server.tool(
  "chart_screenshot",
  "Prend une capture d'écran de la page TradingView actuellement ouverte (via Chrome debug port).",
  {},
  async () => {
    const base64 = await withPage(async (_client, { Page }) => {
      const { data } = await Page.captureScreenshot({ format: "png" });
      return data;
    });
    return {
      content: [{ type: "image", data: base64, mimeType: "image/png" }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Erreur fatale du serveur MCP:", err);
  process.exit(1);
});
