#!/bin/bash

# Vezora AI - Linux/Mac Startup Script
# This script starts both backend and frontend servers

echo ""
echo "========================================"
echo "   VEZORA AI - Starting Services"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "[WARNING] Ollama is not installed!"
    echo "Please install Ollama from https://ollama.ai/"
    echo ""
fi

echo "[1/4] Checking Ollama service..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "[OK] Ollama is already running"
else
    echo "[INFO] Starting Ollama server..."
    osascript -e 'tell app "Terminal" to do script "ollama serve"' &> /dev/null || \
    gnome-terminal -- bash -c "ollama serve; exec bash" &> /dev/null || \
    xterm -e "ollama serve" &> /dev/null || \
    ollama serve &
    sleep 3
fi

echo ""
echo "[2/4] Starting Backend Server..."
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/backend && npm run dev"' &> /dev/null || \
gnome-terminal -- bash -c "cd backend && npm run dev; exec bash" &> /dev/null || \
xterm -e "cd backend && npm run dev" &> /dev/null &
sleep 3

echo ""
echo "[3/4] Starting Frontend App..."
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm run dev"' &> /dev/null || \
gnome-terminal -- bash -c "npm run dev; exec bash" &> /dev/null || \
xterm -e "npm run dev" &> /dev/null &

echo ""
echo "[4/4] Opening Browser..."
sleep 5
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
elif command -v open &> /dev/null; then
    open http://localhost:5173
fi

echo ""
echo "========================================"
echo "   VEZORA AI - All Services Started!"
echo "========================================"
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop this script"
echo "(Services will continue running)"
echo ""

# Keep script running
while true; do
    sleep 60
done
