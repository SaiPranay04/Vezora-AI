@echo off
REM Vezora AI - Windows Startup Script
REM Starts backend + Electron desktop app (Vite + Electron)

title Vezora AI Launcher

echo.
echo ========================================
echo    VEZORA AI - Starting Services
echo ========================================
echo.

REM Always run from this script's directory
cd /d "%~dp0"

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

echo [1/3] Checking Ollama service...
curl -s http://localhost:11434/api/tags >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Starting Ollama server...
    start "Ollama Server" cmd /k ollama serve
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] Ollama is already running
)

echo.
echo [2/3] Starting Backend Server...
curl -s http://localhost:5000/health >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Backend is already running on http://localhost:5000
) else (
    start "Vezora Backend" cmd /k "cd /d ""%~dp0backend"" && npm run dev"
    echo [OK] Backend window launched
    timeout /t 4 /nobreak >nul
)

echo.
echo [3/3] Starting Electron App (Vite + Desktop)...
REM SKIP_ELECTRON_BACKEND=1 tells Electron not to spawn a second backend
start "Vezora Electron" cmd /k "cd /d ""%~dp0"" && set SKIP_ELECTRON_BACKEND=1&& npm run electron:dev"

echo.
echo ========================================
echo    VEZORA AI - Launching Desktop App
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Vite:     http://localhost:5173
echo Desktop:  Electron window (opens after Vite is ready)
echo.
echo Tip: Keep the Backend and Electron console windows open.
echo.
echo Press any key to close this launcher window...
pause >nul
