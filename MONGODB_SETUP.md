# MongoDB Offline Setup

Este projeto está configurado para usar uma base de dados MongoDB local (offline).

## Requisitos

1. **MongoDB Community Server** instalado no seu sistema
   - Download: https://www.mongodb.com/try/download/community
   - Certifique-se de que está no PATH do sistema

## Como usar

### 1. Iniciar a base de dados MongoDB

Execute o script para iniciar o MongoDB local:

```bash
start-mongodb.bat
```

Este comando irá:
- Verificar se o MongoDB está instalado
- Criar um directório `mongodb-data` para os dados
- Iniciar o MongoDB na porta 27017

### 2. Testar a conexão

Para verificar se a base de dados está a funcionar:

```bash
cd backend
npm run test-db
```

### 3. Iniciar o servidor backend

```bash
cd backend
npm install
npm run dev
```

### 4. Limpar a base de dados (opcional)

Para remover todos os dados:

```bash
cd backend
npm run clean-db
```

## Configuração

A configuração da base de dados está no ficheiro `backend/.env`:

```
MONGODB_URI=mongodb://localhost:27017/todolist
JWT_SECRET=todo-app-secret-key-2025
PORT=5000
```

## Estrutura da base de dados

- **Base de dados**: `todolist`
- **Porta**: `27017`
- **Coleções**:
  - `users` - Utilizadores
  - `tasks` - Tarefas
  - `events` - Eventos

## Troubleshooting

### Erro "MongoDB connection error"

1. Certifique-se de que o MongoDB está a correr: `start-mongodb.bat`
2. Verifique se a porta 27017 está disponível
3. Execute `npm run test-db` para diagnosticar

### Dados não são guardados

1. Verifique se o servidor backend está a correr: `npm run dev`
2. Confirme que o MongoDB está ativo
3. Verifique o console do browser para erros de rede

## Vantagens da base de dados offline

✅ **Privacidade**: Os seus dados ficam no seu computador
✅ **Velocidade**: Sem latência de rede
✅ **Offline**: Funciona sem internet
✅ **Controlo total**: Pode fazer backup e restaurar facilmente
