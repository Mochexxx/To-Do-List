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
1. Configure o MongoDB:
   ```bash
   # Verificar caminho do MongoDB
   check-mongodb-path.bat
   
   # Iniciar MongoDB
   start-mongodb.bat
   ```

2. Inicie o backend:
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
