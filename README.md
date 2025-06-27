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

## 📸 Capturas de Ecrã

### Interface Principal
![Página Inicial - Notícias](projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143206.png)
*Vista geral da página inicial com notícias e navegação principal*

### Sistema de Autenticação
<table>
  <tr>
    <td width="50%">
      <img src="projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143427.png" alt="Login" width="100%"/>
      <p align="center"><em>Ecrã de Login</em></p>
    </td>
    <td width="50%">
      <img src="projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143218.png" alt="Registo" width="100%"/>
      <p align="center"><em>Ecrã de Registo</em></p>
    </td>
  </tr>
</table>

### Gestão de Tarefas
<table>
  <tr>
    <td width="50%">
      <img src="projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143226.png" alt="Lista de Tarefas" width="100%"/>
      <p align="center"><em>Dashboard de Tarefas</em></p>
    </td>
    <td width="50%">
      <img src="projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143235.png" alt="Criar Tarefa" width="100%"/>
      <p align="center"><em>Formulário de Criação de Tarefa</em></p>
    </td>
  </tr>
</table>

### Agenda de Eventos
<table>
  <tr>
    <td width="50%">
      <img src="projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143309.png" alt="Agenda" width="100%"/>
      <p align="center"><em>Vista da Agenda</em></p>
    </td>
    <td width="50%">
      <img src="projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143314.png" alt="Criar Evento" width="100%"/>
      <p align="center"><em>Criação de Novo Evento</em></p>
    </td>
  </tr>
</table>

### Sistema de Notificações
<table>
  <tr>
    <td width="50%">
      <img src="projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143349.png" alt="Centro de Notificações" width="100%"/>
      <p align="center"><em>Centro de Notificações</em></p>
    </td>
    <td width="50%">
      <img src="projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143355.png" alt="Configurações de Notificações" width="100%"/>
      <p align="center"><em>Configurações de Notificações</em></p>
    </td>
  </tr>
</table>

### Configurações e Perfil
<table>
  <tr>
    <td width="33%">
      <img src="projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143359.png" alt="Configurações" width="100%"/>
      <p align="center"><em>Painel de Configurações</em></p>
    </td>
    <td width="33%">
      <img src="projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143413.png" alt="Perfil do Utilizador" width="100%"/>
      <p align="center"><em>Perfil do Utilizador</em></p>
    </td>
    <td width="33%">
      <img src="projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143418.png" alt="Modo Escuro" width="100%"/>
      <p align="center"><em>Interface em Modo Escuro</em></p>
    </td>
  </tr>
</table>

### Interface Responsiva
![Interface Mobile](projeto/src/prints/Captura%20de%20ecrã%202025-06-27%20143423.png)
*Interface adaptada para dispositivos móveis*

---

## 🚀 Características Destacadas

- **🎨 Interface Moderna**: Design limpo e intuitivo
- **🌓 Modo Escuro**: Alternância entre temas claro e escuro
- **📱 Responsivo**: Adaptado para desktop e dispositivos móveis
- **🔔 Notificações**: Sistema completo de lembretes e alertas
- **⚡ Performance**: Carregamento rápido e otimizado
- **🔐 Segurança**: Autenticação segura e proteção de dados

---
**© 2025 Pedro Sousa**