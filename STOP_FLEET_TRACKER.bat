@echo off
echo Stopping Logistics Fleet Tracker services...
taskkill /f /im dotnet.exe 2>nul
taskkill /f /im node.exe 2>nul
echo Done!
pause
