@echo off
setlocal

set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
set DEBUG_PORT=9222
set USER_DATA_DIR=%~dp0..\.chrome-debug-profile
set TV_URL=https://www.tradingview.com/chart/

if not exist %CHROME_PATH% (
    set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

if not exist %CHROME_PATH% (
    echo Chrome introuvable. Modifiez CHROME_PATH dans ce script.
    exit /b 1
)

echo Lancement de Chrome avec debugging sur le port %DEBUG_PORT%...
start "" %CHROME_PATH% --remote-debugging-port=%DEBUG_PORT% --user-data-dir="%USER_DATA_DIR%" --no-first-run --no-default-browser-check %TV_URL%

echo Chrome DevTools Protocol disponible sur http://localhost:%DEBUG_PORT%
endlocal
