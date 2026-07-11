@echo off
echo ========================================
echo   Downloading Cloudflare Tunnel
echo ========================================
echo.

echo This script will download cloudflared.exe to the project folder.
echo This helps avoid antivirus blocking issues.
echo.

echo Downloading from GitHub...
echo.

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'}"

if exist cloudflared.exe (
    echo.
    echo ========================================
    echo   SUCCESS!
    echo ========================================
    echo.
    echo cloudflared.exe downloaded successfully!
    echo.
    echo Now you can run: npm run cloudflare
    echo.
) else (
    echo.
    echo ========================================
    echo   ERROR
    echo ========================================
    echo.
    echo Failed to download cloudflared.exe
    echo.
    echo Please download manually from:
    echo https://github.com/cloudflare/cloudflared/releases/latest
    echo.
    echo Look for: cloudflared-windows-amd64.exe
    echo Rename it to: cloudflared.exe
    echo Put it in the project folder.
    echo.
)

pause
