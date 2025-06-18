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
      // Campos básicos
      _id: Date.now().toString(), // Simple ID generation
      title: task.title || '',
      description: task.description || '',
      
      // Campos de tempo
      startDate: task.startDate || '',
      dueDate: task.dueDate || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Campos de organização
      priority: task.priority || 'média',
      category: task.category || 'pessoal',
      status: task.status || 'pendente',
      
      // Campos adicionais
      isRecurrent: task.isRecurrent || false,
      tags: Array.isArray(task.tags) ? task.tags : [],
      estimatedDuration: task.estimatedDuration || '',
      
      // Metadados
      userId: task.userId || null,
      
      // Preservar outros campos que possam existir
      ...task
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return newTask;
  },
  updateTask(taskId, updateData) {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(task => task._id === taskId);
    if (taskIndex === -1) throw new Error('Tarefa não encontrada');
    
    // Garantir que campos de array sejam tratados corretamente
    const processedUpdateData = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Processar tags se fornecidas
    if (updateData.tags && typeof updateData.tags === 'string') {
      processedUpdateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...processedUpdateData
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
      // Sanitizar e validar dados
      const sanitizedData = taskValidationService.sanitizeTaskData(taskData);
      const validation = taskValidationService.validateTaskData(sanitizedData);
      
      if (!validation.isValid) {
        throw new Error('Dados inválidos: ' + validation.errors.join(', '));
      }
      
      // Add user ID to task
      const user = authService.getUser();
      const taskWithUser = {
        ...sanitizedData,
        userId: user?.id
      };
      
      return storageService.addTask(taskWithUser);
    } catch (error) {
      throw new Error('Erro ao criar tarefa: ' + error.message);
    }
  },

  async updateTask(taskId, taskData) {
    try {
      // Sanitizar e validar dados (apenas campos fornecidos)
      const sanitizedData = taskValidationService.sanitizeTaskData(taskData);
      
      // Para updates, validar apenas se há dados suficientes
      if (taskData.title !== undefined) {
        const validation = taskValidationService.validateTaskData(sanitizedData);
        if (!validation.isValid) {
          throw new Error('Dados inválidos: ' + validation.errors.join(', '));
        }
      }
      
      return storageService.updateTask(taskId, sanitizedData);
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
    const now = new Date();
    
    return {
      // Estatísticas básicas
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'concluída').length,
      pending: tasks.filter(t => t.status === 'pendente').length,
      inProgress: tasks.filter(t => t.status === 'em progresso').length,
      
      // Estatísticas de prazo
      overdue: tasks.filter(t => {
        return t.dueDate && new Date(t.dueDate) < now && t.status !== 'concluída';
      }).length,
      
      // Estatísticas por prioridade
      priorities: {
        baixa: tasks.filter(t => t.priority === 'baixa').length,
        média: tasks.filter(t => t.priority === 'média').length,
        alta: tasks.filter(t => t.priority === 'alta').length,
        urgente: tasks.filter(t => t.priority === 'urgente').length
      },
      
      // Estatísticas por categoria
      categories: {
        pessoal: tasks.filter(t => t.category === 'pessoal').length,
        trabalho: tasks.filter(t => t.category === 'trabalho').length,
        estudos: tasks.filter(t => t.category === 'estudos').length,
        saude: tasks.filter(t => t.category === 'saude').length,
        financas: tasks.filter(t => t.category === 'financas').length
      },
      
      // Estatísticas de recorrência
      recurrent: tasks.filter(t => t.isRecurrent === true).length,
      
      // Estatísticas de tags mais usadas
      topTags: this.getTopTags(tasks, 5),
      
      // Duração estimada média
      averageEstimatedDuration: this.getAverageEstimatedDuration(tasks)
    };
  },
  
  getTopTags(tasks, limit = 5) {
    const tagCount = {};
    tasks.forEach(task => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  },
  
  getAverageEstimatedDuration(tasks) {
    const durationsInMinutes = {
      '15min': 15,
      '30min': 30,
      '1h': 60,
      '2h': 120,
      '4h': 240,
      '8h': 480,
      '1d+': 480 // Considerando como 8h+ para cálculo
    };
    
    const tasksWithDuration = tasks.filter(t => t.estimatedDuration && durationsInMinutes[t.estimatedDuration]);
    if (tasksWithDuration.length === 0) return null;
    
    const totalMinutes = tasksWithDuration.reduce((sum, task) => {
      return sum + durationsInMinutes[task.estimatedDuration];
    }, 0);
    
    const averageMinutes = totalMinutes / tasksWithDuration.length;
    
    if (averageMinutes < 60) return `${Math.round(averageMinutes)}min`;
    if (averageMinutes < 480) return `${Math.round(averageMinutes / 60)}h`;
    return `${Math.round(averageMinutes / 480)}d`;
  }
};

// Validation Service for task data
const taskValidationService = {
  validateTaskData(taskData) {
    const errors = [];
    
    // Validar título (obrigatório)
    if (!taskData.title || taskData.title.trim().length === 0) {
      errors.push('Título é obrigatório');
    } else if (taskData.title.length > 200) {
      errors.push('Título deve ter no máximo 200 caracteres');
    }
    
    // Validar descrição
    if (taskData.description && taskData.description.length > 2000) {
      errors.push('Descrição deve ter no máximo 2000 caracteres');
    }
    
    // Validar prioridade
    const validPriorities = ['baixa', 'média', 'alta', 'urgente'];
    if (taskData.priority && !validPriorities.includes(taskData.priority)) {
      errors.push('Prioridade inválida');
    }
    
    // Validar status
    const validStatuses = ['pendente', 'em progresso', 'concluída'];
    if (taskData.status && !validStatuses.includes(taskData.status)) {
      errors.push('Status inválido');
    }
    
    // Validar categoria
    const validCategories = ['pessoal', 'trabalho', 'estudos', 'saude', 'financas'];
    if (taskData.category && !validCategories.includes(taskData.category)) {
      errors.push('Categoria inválida');
    }
    
    // Validar duração estimada
    const validDurations = ['15min', '30min', '1h', '2h', '4h', '8h', '1d+'];
    if (taskData.estimatedDuration && !validDurations.includes(taskData.estimatedDuration)) {
      errors.push('Duração estimada inválida');
    }
    
    // Validar datas
    if (taskData.startDate && taskData.dueDate) {
      const startDate = new Date(taskData.startDate);
      const dueDate = new Date(taskData.dueDate);
      if (startDate > dueDate) {
        errors.push('Data de início não pode ser posterior à data de prazo');
      }
    }
    
    // Validar tags
    if (taskData.tags) {
      if (Array.isArray(taskData.tags)) {
        taskData.tags.forEach((tag, index) => {
          if (typeof tag !== 'string' || tag.length > 50) {
            errors.push(`Tag ${index + 1} inválida (máximo 50 caracteres)`);
          }
        });
      } else {
        errors.push('Tags devem ser um array');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },
  
  sanitizeTaskData(taskData) {
    const sanitized = { ...taskData };
    
    // Limpar e padronizar campos de texto
    if (sanitized.title) sanitized.title = sanitized.title.trim();
    if (sanitized.description) sanitized.description = sanitized.description.trim();
    
    // Garantir que tags seja um array
    if (sanitized.tags && typeof sanitized.tags === 'string') {
      sanitized.tags = sanitized.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    // Garantir valores padrão
    if (!sanitized.priority) sanitized.priority = 'média';
    if (!sanitized.category) sanitized.category = 'pessoal';
    if (!sanitized.status) sanitized.status = 'pendente';
    if (sanitized.isRecurrent === undefined) sanitized.isRecurrent = false;
    
    return sanitized;
  }
};

// Export for use in HTML
window.authService = authService;
window.tasksService = tasksService;
window.storageService = storageService;
window.taskValidationService = taskValidationService;
window.taskValidationService = taskValidationService;
