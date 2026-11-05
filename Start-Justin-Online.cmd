@echo off
cd /d "%~dp0"
node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)" >nul 2>&1
if errorlevel 1 (
  echo Justin Online needs Node.js 24 or later from https://nodejs.org/
  pause
  exit /b 1
)
echo.
echo Keep this window open while playing.
echo Open http://127.0.0.1:8765/ in your browser.
echo This is a local preview. It is not a public internet server.
echo.
node server/server.mjs
pause
