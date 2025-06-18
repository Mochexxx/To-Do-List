@echo off
echo ===============================================
echo    MongoDB Local Database Setup
echo ===============================================
echo.

echo Verificando se o MongoDB está instalado...
mongod --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: MongoDB não está instalado ou não está no PATH
    echo.
    echo Para instalar o MongoDB:
    echo 1. Vá a https://www.mongodb.com/try/download/community
    echo 2. Baixe o MongoDB Community Server para Windows
    echo 3. Instale seguindo as instruções
    echo 4. Adicione o MongoDB ao PATH do sistema
    echo.
    pause
    exit /b 1
)

echo MongoDB encontrado!
echo.

echo Criando directório de dados se não existir...
if not exist "%cd%\mongodb-data" (
    mkdir "%cd%\mongodb-data"
    echo Directório mongodb-data criado.
) else (
    echo Directório mongodb-data já existe.
)

echo.
echo Iniciando MongoDB local...
echo Porta: 27017
echo Base de dados: todolist
echo Directório de dados: %cd%\mongodb-data
echo.
echo Para parar o MongoDB, pressione Ctrl+C
echo.

mongod --dbpath "%cd%\mongodb-data" --port 27017
