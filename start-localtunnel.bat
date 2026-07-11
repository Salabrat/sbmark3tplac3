@echo off
echo ========================================
echo   Starting Server and Localtunnel
echo ========================================
echo.

echo [1/2] Starting server on port 3002...
start cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Localtunnel...
echo.
echo Waiting for server to start...
timeout /t 2 /nobreak >nul

start cmd /k "lt --port 3002"

echo.
echo ========================================
echo   Server and Tunnel Started!
echo ========================================
echo.
echo Check the Localtunnel window for your HTTPS URL
echo It will look like: https://random-name.loca.lt
echo.
echo Copy this URL, add /TGminiapp.html
echo and update it in BotFather
echo.
pause
