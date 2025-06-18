# 📝 To-Do List

**Desenvolvido por:** Pedro Sousa

## Descrição
Aplicação web para gestão de tarefas e notícias, criada com React.

## Funcionalidades
- ✅ Criar, editar e eliminar tarefas
-  Notícias de várias categorias
- 📅 Agenda de eventos
- 👤 Sistema de login
- ⚙️ Configurações personalizáveis

## Como Executar

### Forma Simples
1. Abra o arquivo `projeto/public/index.html` no navegador

### Com Servidor Local (Recomendado)
```bash
cd projeto/public
python -m http.server 8000
```
Depois abra: `http://localhost:8000`

### Com Base de Dados (Completo)
1. Instale e inicie o MongoDB:
   ```powershell
   # Instalar MongoDB (caso não esteja instalado)
   # Via chocolatey:
   choco install mongodb
   
   # Ou baixe diretamente do site oficial:
   # https://www.mongodb.com/try/download/community

   # Iniciar MongoDB
   # Se instalado como serviço:
   Start-Service MongoDB
   
   # Ou manualmente:
   "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
   ```

2. Colocar a API do NewsAPI no arquivo `backend/config.js`:
   ```javascript
   // Colocar Aqui a Api do newsApi
   const NEWS_API_KEY = '+++++++++YOUR_API_KEY+++++++++';
   ```
   const NEWS_API_URL = 'https://newsapi.org/v2';
   

3. Inicie o backend:
   ```bash
   cd backend
   npm install
   npm start
   ```


## Tecnologias
- React 18
- HTML5/CSS3
- JavaScript
- NewsAPI
- MongoDB (base de dados)
- Node.js (backend)

---
**© 2025 Pedro Sousa**
