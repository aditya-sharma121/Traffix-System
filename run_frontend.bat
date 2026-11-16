@echo off
echo ========================================================
echo        TRAFFIQ: AI-Powered Intelligent Traffic System
echo                  Launching Frontend UI...
echo ========================================================

cd frontend
if not exist node_modules (
    echo Installing node dependencies...
    npm install
)

echo Starting Vite development server on http://localhost:5173 ...
npm run dev
pause
