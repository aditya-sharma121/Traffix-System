@echo off
echo ========================================================
echo        TRAFFIQ: AI-Powered Intelligent Traffic System
echo              Launching Full Stack Application...
echo ========================================================

start "TRAFFIQ Backend" cmd /c "run_backend.bat"
timeout /t 3 /nobreak >nul
start "TRAFFIQ Frontend" cmd /c "run_frontend.bat"

echo.
echo TRAFFIQ services initiated!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
pause
