@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   Starting Server and Cloudflare Tunnel
echo ========================================
echo.
echo Current directory: %CD%
echo.

echo [1/2] Starting server on port 3002...
start cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Cloudflare Tunnel...
echo.
echo Waiting for server to start...
timeout /t 2 /nobreak >nul

start cmd /k "cloudflared tunnel --url http://localhost:3002"

echo.
echo ========================================
echo   Server and Tunnel Started!
echo ========================================
echo.
echo Check the Cloudflare Tunnel window for your HTTPS URL
echo It will look like: https://random-name.trycloudflare.com
echo.
echo Copy this URL and update it in BotFather:
echo Bot Settings -> Menu Button -> Set URL
echo.
pause
