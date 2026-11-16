@echo off
echo ========================================================
echo        TRAFFIQ: AI-Powered Intelligent Traffic System
echo                  Launching Backend API...
echo ========================================================

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r backend\requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo Starting Uvicorn server on http://127.0.0.1:8000 ...
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
