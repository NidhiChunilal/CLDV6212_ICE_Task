@echo off
title Logistics Fleet Tracker Launcher
echo ========================================================
echo Starting Logistics Fleet Tracker (Backend & Frontend)...
echo ========================================================

start "Backend API (Port 5000)" cmd /k "cd /d backend\LogisticsFleetTracker.Api && dotnet run --launch-profile http"
timeout /t 4 /nobreak >nul

start "Frontend UI (Port 5173)" cmd /k "cd /d frontend && npm run dev"
timeout /t 3 /nobreak >nul

start http://localhost:5173
echo Logistics Fleet Tracker is now running at http://localhost:5173
