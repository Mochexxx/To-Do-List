@echo off
echo ===============================================
echo    Verificar e Configurar PATH do MongoDB
echo ===============================================
echo.

echo 1. Verificando se MongoDB está no PATH...
mongod --version >nul 2>&1
if errorlevel 1 (
    echo ❌ MongoDB NÃO está no PATH
    echo.
    echo 2. Procurando MongoDB no sistema...
    
    REM Locais comuns onde o MongoDB é instalado
    set "POSSIBLE_PATHS=C:\Program Files\MongoDB\Server\7.0\bin;C:\Program Files\MongoDB\Server\6.0\bin;C:\Program Files\MongoDB\Server\5.0\bin;C:\Program Files\MongoDB\Server\4.4\bin"
    
    for %%p in ("%POSSIBLE_PATHS:;=" "%") do (
        if exist "%%~p\mongod.exe" (
            echo ✅ MongoDB encontrado em: %%~p
            echo.
            echo 3. Para adicionar ao PATH:
            echo    a) Pressione Win + R
            echo    b) Digite: sysdm.cpl
            echo    c) Clique em "Variáveis de Ambiente"
            echo    d) Em "Variáveis do Sistema", encontre "Path"
            echo    e) Clique em "Editar"
            echo    f) Clique em "Novo"
            echo    g) Cole este caminho: %%~p
            echo    h) Clique em "OK" em todas as janelas
            echo    i) Reinicie o Command Prompt
            echo.
            goto :found
        )
    )
    
    echo ❌ MongoDB não foi encontrado nos locais padrão
    echo.
    echo 📥 INSTALAR MONGODB:
    echo 1. Vá a: https://www.mongodb.com/try/download/community
    echo 2. Baixe "MongoDB Community Server"
    echo 3. Execute o instalador
    echo 4. Durante a instalação, marque "Install MongoDB as a Service"
    echo 5. Depois da instalação, execute este script novamente
    echo.
    
) else (
    echo ✅ MongoDB já está configurado no PATH!
    echo.
    echo Versão instalada:
    mongod --version
    echo.
    echo ✅ Pode continuar com a configuração da base de dados.
)

:found
echo.
echo ===============================================
echo Para testar se funcionou:
echo 1. Feche este terminal
echo 2. Abra um novo Command Prompt
echo 3. Digite: mongod --version
echo ===============================================
echo.
pause
