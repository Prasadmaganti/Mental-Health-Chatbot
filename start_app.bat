@echo off
title Lumina Startup Script
echo ===================================================
echo   🌸 Starting Lumina: Mental Health Chatbot 🌸
echo ===================================================
echo.

:: 1. Start FastAPI Backend in a new window
echo Starting Backend Server...
start "Lumina Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\activate && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

:: 2. Start Next.js Frontend in a new window
echo Starting Frontend Server...
start "Lumina Frontend (Next.js)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================================
echo   🚀 Done! The servers are starting up.
echo   - Frontend: http://127.0.0.1:3000
echo   - Backend:  http://127.0.0.1:8000
echo ===================================================
echo.
pause
