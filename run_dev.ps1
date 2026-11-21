# PixelLab Development Services Launcher (PowerShell)
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  PIXELLAB - DIGITAL IMAGE PROCESSING STUDIO" -ForegroundColor Cyan
Write-Host "  Starting all services for local development..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# 1. Start Python OpenCV Service
Write-Host "[1/3] Starting Python OpenCV Service on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd opencv-service; .\venv\Scripts\activate; uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# 2. Start Express Backend
Write-Host "[2/3] Starting Express API on http://localhost:5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# 3. Start Vite Frontend
Write-Host "[3/3] Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nAll 3 services launched in separate windows." -ForegroundColor Green
Write-Host "Open http://localhost:5173 in your browser." -ForegroundColor Green

