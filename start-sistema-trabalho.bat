@echo off
echo ====================================
echo  Iniciando Sistema MonitorOP
echo  Ambiente: TRABALHO
echo ====================================
echo.

echo [1/2] Iniciando Backend...
start "Backend - Flask" cmd /k "cd backend && python run.py"

echo [2/2] Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo [2/2] Iniciando Frontend (Trabalho)...
start "Frontend - React" cmd /k "cd frontend && npm run start:trabalho"

echo.
echo ====================================
echo  Sistema iniciado!
echo  Backend: http://192.168.6.31:5000
echo ====================================
pause