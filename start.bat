@echo off
echo ======================================================================
echo             GridWise - Edge BEMS Control Console
echo ======================================================================
echo.

echo [1/2] Starting GridWise FastAPI Backend on http://localhost:8000...
start "GridWise Backend" cmd /k "cd /d %~dp0backend && python run.py"

echo [2/2] Starting GridWise React+Vite Frontend on http://localhost:5173...
start "GridWise Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are launching!
echo Backend:  http://localhost:8000 (API & Docs at /docs)
echo Frontend: http://localhost:5173 (Control Console)
echo.
pause
