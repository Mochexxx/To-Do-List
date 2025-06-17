const API_BASE_URL = 'http://localhost:5000/api';

// Storage Service for local data persistence
const storageService = {
  getTasks() {
    const tasks = localStorage.getItem('tasks');
    return tasks ? JSON.parse(tasks) : [];
  },

  saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  },

  addTask(task) {
    const tasks = this.getTasks();
    const newTask = {
      ...task,
      _id: Date.now().toString(), // Simple ID generation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return newTask;
  },

  updateTask(taskId, updateData) {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(task => task._id === taskId);
    if (taskIndex === -1) throw new Error('Tarefa não encontrada');
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.saveTasks(tasks);
    return tasks[taskIndex];
  },

  deleteTask(taskId) {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(task => task._id !== taskId);
    this.saveTasks(filteredTasks);
    return { message: 'Tarefa deletada com sucesso' };
  },

  clear() {
    localStorage.removeItem('tasks');
  }
};

// Auth Service
const authService = {
  async register(userData) {
    try {
      // Create comprehensive user object with all registration data
      const user = {
        id: Date.now().toString(),
        username: userData.username,
        email: userData.email,
        country: userData.country,
        countryName: userData.countryName,
        newsCountryCode: userData.newsCountryCode,
        registeredAt: userData.registeredAt,
        createdAt: new Date().toISOString()
      };
      
      const token = btoa(JSON.stringify({ userId: user.id, username: user.username }));
      
      // Save user data and token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Save user preferences with country-based defaults
      const userPreferences = {
        newsCountry: userData.newsCountryCode,
        language: userData.country === 'br' ? 'pt-BR' : userData.country === 'pt' ? 'pt-PT' : 'en',
        timezone: this.getTimezoneByCountry(userData.country),
        notifications: true,
        defaultPriority: 'média',
        darkMode: false
      };
      localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
      
      return { token, user, message: 'Registro realizado com sucesso!' };
    } catch (error) {
      throw error;
    }
  },

  getTimezoneByCountry(countryCode) {
    const timezones = {
      'pt': 'Europe/Lisbon',
      'br': 'America/Sao_Paulo', 
      'us': 'America/New_York',
      'uk': 'Europe/London',
      'es': 'Europe/Madrid',
      'fr': 'Europe/Paris',
      'de': 'Europe/Berlin',
      'it': 'Europe/Rome',
      'ca': 'America/Toronto',
      'au': 'Australia/Sydney',
      'jp': 'Asia/Tokyo',
      'cn': 'Asia/Shanghai',
      'in': 'Asia/Kolkata',
      'mx': 'America/Mexico_City',
      'ar': 'America/Argentina/Buenos_Aires'
    };
    return timezones[countryCode] || 'UTC';
  },

  async login(credentials) {
    try {
      // For offline mode, simulate login validation
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        throw new Error('Nenhum usuário registrado. Crie uma conta primeiro.');
      }
      
      const user = JSON.parse(savedUser);
      const token = btoa(JSON.stringify({ userId: user.id, username: user.username }));
      
      localStorage.setItem('token', token);
      
      return { token, user, message: 'Login realizado com sucesso (modo offline)' };
    } catch (error) {
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('token');
    // Keep user data for future logins
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

// Tasks Service with local storage
const tasksService = {
  async getTasks() {
    try {
      // Use local storage for data persistence
      return storageService.getTasks();
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      return [];
    }
  },

  async createTask(taskData) {
    try {
      // Add user ID to task
      const user = authService.getUser();
      const taskWithUser = {
        ...taskData,
        userId: user?.id
      };
      
      return storageService.addTask(taskWithUser);
    } catch (error) {
      throw new Error('Erro ao criar tarefa: ' + error.message);
    }
  },

  async updateTask(taskId, taskData) {
    try {
      return storageService.updateTask(taskId, taskData);
    } catch (error) {
      throw new Error('Erro ao atualizar tarefa: ' + error.message);
    }
  },

  async deleteTask(taskId) {
    try {
      return storageService.deleteTask(taskId);
    } catch (error) {
      throw new Error('Erro ao deletar tarefa: ' + error.message);
    }
  },
  // Utility methods
  exportTasks() {
    const tasks = storageService.getTasks();
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  },

  importTasks(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const tasks = JSON.parse(e.target.result);
          if (Array.isArray(tasks)) {
            storageService.saveTasks(tasks);
            resolve(tasks);
          } else {
            reject(new Error('Formato de arquivo inválido'));
          }
        } catch (error) {
          reject(new Error('Erro ao processar arquivo: ' + error.message));
        }
      };
      reader.readAsText(file);
    });
  },

  clearAllTasks() {
    if (confirm('Tem certeza que deseja deletar TODAS as tarefas? Esta ação não pode ser desfeita.')) {
      storageService.clear();
      return true;
    }
    return false;
  },

  getStats() {
    const tasks = storageService.getTasks();
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'concluída').length,
      pending: tasks.filter(t => t.status === 'pendente').length,
      inProgress: tasks.filter(t => t.status === 'em_progresso').length,
      overdue: tasks.filter(t => {
        return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'concluída';
      }).length
    };
  }
};

// Export for use in HTML
window.authService = authService;
window.tasksService = tasksService;
window.storageService = storageService;
