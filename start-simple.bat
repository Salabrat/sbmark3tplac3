@echo off
echo Starting server...
start cmd /k "node server.js"

timeout /t 3 /nobreak >nul

echo Starting ngrok...
start cmd /k "ngrok http 3002"

echo.
echo ==========================================
echo Server running at http://localhost:3002
echo ngrok tunnel starting...
echo.
echo Open http://127.0.0.1:4040 to see ngrok URL
echo ==========================================
echo.
