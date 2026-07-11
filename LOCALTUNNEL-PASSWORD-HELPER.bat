@echo off
echo ========================================
echo   Getting Localtunnel Password
echo ========================================
echo.
echo Your tunnel password is your public IP address.
echo.
echo Getting your IP address...
echo.

powershell -Command "(Invoke-WebRequest -Uri 'https://loca.lt/mytunnelpassword' -UseBasicParsing).Content" > temp_ip.txt

if exist temp_ip.txt (
    set /p TUNNEL_PASSWORD=<temp_ip.txt
    echo.
    echo ========================================
    echo   YOUR TUNNEL PASSWORD:
    echo ========================================
    echo.
    echo   %TUNNEL_PASSWORD%
    echo.
    echo ========================================
    echo.
    echo Copy this IP address and use it as password
    echo when localtunnel asks for it.
    echo.
    del temp_ip.txt
) else (
    echo.
    echo Failed to get IP address.
    echo.
    echo Please visit manually:
    echo https://loca.lt/mytunnelpassword
    echo.
    echo Or check your IP on:
    echo https://whatismyipaddress.com/
    echo.
)

pause
