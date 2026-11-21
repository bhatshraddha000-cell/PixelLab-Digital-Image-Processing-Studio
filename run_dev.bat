@echo off
TITLE PixelLab Studio Launcher
echo ===================================================
echo   PIXELLAB - DIGITAL IMAGE PROCESSING STUDIO
echo   Starting all services for development...
echo ===================================================

:: 1. Launch Python OpenCV Service on Port 8000
echo [1/3] Starting Python OpenCV Service (Port 8000)...
start "PixelLab - OpenCV Service (8000)" cmd /k "cd opencv-service && .\venv\Scripts\activate && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: 2. Launch Express Backend on Port 5000
echo [2/3] Starting Express Backend API (Port 5000)...
start "PixelLab - Express Backend (5000)" cmd /k "cd backend && npm run dev"

:: 3. Launch Vite React Frontend on Port 5173
echo [3/3] Starting Vite React Frontend (Port 5173)...
start "PixelLab - Frontend (5173)" cmd /k "cd frontend && npm run dev"

echo ===================================================
echo   All 3 services launched successfully!
echo   - Frontend:  http://localhost:5173
echo   - Backend:   http://localhost:5000
echo   - OpenCV:    http://127.0.0.1:8000
echo ===================================================
pause

