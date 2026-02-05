@echo off
REM Vezora AI - Windows Startup Script
REM This script starts both backend and frontend servers

title Vezora AI Launcher

echo.
echo ========================================
echo    VEZORA AI - Starting Services
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Ollama is installed
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Ollama is not installed!
    echo Please install Ollama from https://ollama.ai/
    echo.
)

echo [1/4] Checking Ollama service...
curl -s http://localhost:11434/api/tags >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Starting Ollama server...
    start "Ollama Server" cmd /k "ollama serve"
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] Ollama is already running
)

echo.
echo [2/4] Starting Backend Server...
start "Vezora Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo [3/4] Starting Frontend App...
start "Vezora Frontend" cmd /k "npm run dev"

echo.
echo [4/4] Opening Browser...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo    VEZORA AI - All Services Started!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to keep this window open...
pause >nul
