@echo off
echo ====================================
echo  Iniciando Sistema MonitorOP
echo  Ambiente: CASA
echo ====================================
echo.

echo [1/2] Iniciando Backend...
start "Backend - Flask" cmd /k "cd backend && python run.py"

echo [2/2] Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo [2/2] Iniciando Frontend (Casa)...
start "Frontend - React" cmd /k "cd frontend && npm start"

echo.
echo ====================================
echo  Sistema iniciado!
echo  Backend: http://192.168.1.16:5000
echo ====================================
pause