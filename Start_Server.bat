@echo off
title Starting Services...
echo Starting MongoDB...

REM Load environment variables from config.txt
for /f "tokens=1,* delims==" %%A in (config.txt) do (
    set %%A=%%B
)

REM Start MongoDB in the background
start /b "" "%MONGODB_DIR%\mongod.exe" --dbpath "%DB_PATH%"

REM Wait for MongoDB to initialize (adjust time as needed)
timeout /t 5 >nul

echo Opening the system landing page...
REM Change the URL/port to match your server setup
start "" "http://localhost:3000"

echo.
echo Starting Node.js Server in this same window...
echo (Logs will appear here; press Ctrl+C to stop.)
cd /d "%NODE_SERVER_PATH%"
node server.js

echo.
echo ✅ All services started successfully!
echo (You won't see this until Node.js exits)
pause >nul
