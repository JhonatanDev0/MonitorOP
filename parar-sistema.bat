@echo off
echo ====================================
echo  Parando Sistema MonitorOP
echo ====================================
echo.

echo Fechando processos do Node.js (Frontend)...
taskkill /F /IM node.exe /T 2>nul

echo Fechando processos do Python (Backend)...
taskkill /F /IM python.exe /T 2>nul

echo.
echo ====================================
echo  Sistema parado!
echo ====================================
timeout /t 2