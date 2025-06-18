@echo off
echo 🚀 Iniciando aplicacao To-Do List...
echo.

echo 📡 Verificando se o backend esta rodando...
curl -s http://localhost:5000/ >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend ja esta rodando em http://localhost:5000
) else (
    echo ⚠️ Backend nao encontrado. Iniciando...
    cd /d "%~dp0backend"
    start "Backend To-Do List" cmd /k "npm start"
    echo ✅ Backend iniciado em nova janela
    cd /d "%~dp0"
    timeout /t 3 >nul
)

echo.
echo 🌐 Abrindo aplicacao no navegador...
start "" "http://localhost:5000" 2>nul || (
    echo 📂 Abrindo arquivo HTML local...
    start "" "%~dp0projeto\public\index.html"
)

echo.
echo 🎯 Aplicacao pronta!
echo 📋 Para testar as funcionalidades CRUD:
echo    1. Acesse Dashboard ^> Perfil
echo    2. Altere seu nome na aba 'Informacoes'
echo    3. Verifique se o nome muda no header
echo.
echo 🧪 Para testes avancados, abra DevTools (F12) e execute:
echo    testProfileUpdate()
echo.
pause
