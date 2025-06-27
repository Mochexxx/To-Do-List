# 📝 Lista de Tarefas

**Desenvolvido por:** Pedro Sousa

## Descrição
Aplicação web para gestão de tarefas e notícias, criada com React.

## Funcionalidades
- ✅ Criar, editar e eliminar tarefas
- 📰 Notícias de várias categorias com imagens em formato quadrado
- 📅 Agenda de eventos
- 👤 Sistema de autenticação
- ⚙️ Configurações personalizáveis

## Como Utilizar

### Forma Simples
1. Abra o ficheiro `projeto/public/index.html` no navegador

### Com Servidor Local (Recomendado)
```bash
cd projeto/public
python -m http.server 8000
```
Depois aceda a: `http://localhost:8000`

### Com Base de Dados (Versão Completa)
1. Instale e inicie o MongoDB:
   ```powershell
   # Instalar MongoDB (caso não esteja instalado)
   # Via chocolatey:
   choco install mongodb
   
   # Ou descarregue diretamente do site oficial:
   # https://www.mongodb.com/try/download/community

   # Iniciar MongoDB
   # Se instalado como serviço:
   Start-Service MongoDB
   
   # Ou manualmente:
   "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
   ```

2. Colocar a chave API do NewsAPI no ficheiro `projeto/src/services/news.js`:
   ```javascript
   // Colocar Aqui a Api do newsApi
   const NEWS_API_KEY = '+++++++++YOUR_API_KEY+++++++++';
   ```

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



![alt text](<Captura de ecrã 2025-06-27 143206.png>)


![alt text](<Captura de ecrã 2025-06-27 143427.png>) ![alt text](<Captura de ecrã 2025-06-27 143218.png>) ![alt text](<Captura de ecrã 2025-06-27 143226.png>) ![alt text](<Captura de ecrã 2025-06-27 143235.png>) ![alt text](<Captura de ecrã 2025-06-27 143309.png>) ![alt text](<Captura de ecrã 2025-06-27 143314.png>) ![alt text](<Captura de ecrã 2025-06-27 143349.png>) ![alt text](<Captura de ecrã 2025-06-27 143355.png>) ![alt text](<Captura de ecrã 2025-06-27 143359.png>) ![alt text](<Captura de ecrã 2025-06-27 143413.png>) ![alt text](<Captura de ecrã 2025-06-27 143418.png>) ![alt text](<Captura de ecrã 2025-06-27 143423.png>)