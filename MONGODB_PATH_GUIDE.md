# Como Configurar o PATH do MongoDB no Windows

## 🔍 Verificar se MongoDB está instalado

Execute o script que criei:
```bash
check-mongodb-path.bat
```

## 📍 Locais comuns do MongoDB

O MongoDB normalmente é instalado em:
- `C:\Program Files\MongoDB\Server\7.0\bin`
- `C:\Program Files\MongoDB\Server\6.0\bin`
- `C:\Program Files\MongoDB\Server\5.0\bin`
- `C:\Program Files\MongoDB\Server\4.4\bin`

## 🛠️ Como adicionar ao PATH (Passo a passo)

### Método 1: Interface Gráfica

1. **Abrir Variáveis de Ambiente:**
   - Pressione `Win + R`
   - Digite: `sysdm.cpl`
   - Pressione Enter

2. **Editar PATH:**
   - Clique em "Variáveis de Ambiente"
   - Em "Variáveis do Sistema", encontre "Path"
   - Clique em "Editar"
   - Clique em "Novo"
   - Cole o caminho do MongoDB (ex: `C:\Program Files\MongoDB\Server\7.0\bin`)
   - Clique em "OK" em todas as janelas

3. **Testar:**
   - Feche todos os terminais
   - Abra um novo Command Prompt
   - Digite: `mongod --version`

### Método 2: PowerShell (Avançado)

```powershell
# Encontrar MongoDB
Get-ChildItem "C:\Program Files\MongoDB" -Recurse -Name "mongod.exe"

# Adicionar ao PATH (substitua o caminho pelo correto)
$mongoPath = "C:\Program Files\MongoDB\Server\7.0\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
[Environment]::SetEnvironmentVariable("Path", "$currentPath;$mongoPath", "Machine")
```

## 📥 Se MongoDB não estiver instalado

1. **Download:**
   - Vá a: https://www.mongodb.com/try/download/community
   - Escolha "MongoDB Community Server"
   - Selecione "Windows" como plataforma
   - Baixe o ficheiro `.msi`

2. **Instalação:**
   - Execute o ficheiro baixado
   - Durante a instalação:
     - ✅ Marque "Install MongoDB as a Service"
     - ✅ Marque "Install MongoDB Compass" (interface gráfica)
   - Complete a instalação

3. **Verificar:**
   - Execute: `check-mongodb-path.bat`

## ✅ Verificar se funcionou

Depois de configurar o PATH:

```bash
# Teste 1: Verificar versão
mongod --version

# Teste 2: Testar conexão com a base de dados
cd backend
npm run test-db
```

## 🚨 Problemas comuns

### "mongod não é reconhecido como comando"
- ❌ MongoDB não está no PATH
- ✅ Siga os passos acima para adicionar ao PATH

### "Access is denied"
- ❌ Falta de permissões
- ✅ Execute o Command Prompt como Administrador

### "Failed to connect to MongoDB"
- ❌ MongoDB não está a correr
- ✅ Execute: `start-mongodb.bat`

## 🎯 Próximos passos

Depois de configurar o PATH:

1. Execute: `start-mongodb.bat`
2. Execute: `cd backend && npm run test-db`
3. Execute: `cd backend && npm run dev`
4. Teste a criação de tarefas na aplicação
