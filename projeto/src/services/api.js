const API_BASE_URL = 'http://localhost:5000/api';

// Função para verificar se o backend está disponível
const checkBackendConnectivity = async () => {
  try {
    const response = await fetch('http://localhost:5000/', { 
      method: 'GET',
      timeout: 3000 
    });
    return response.ok;
  } catch (error) {
    console.log('Backend não disponível, usando modo offline');
    return false;
  }
};

// Helper function para fazer requisições HTTP
const makeRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  const response = await fetch(url, finalOptions);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro na requisição');
  }
  
  return response.json();
};

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
  isOnlineMode: false,

  async initialize() {
    this.isOnlineMode = await checkBackendConnectivity();
    console.log(`Modo ${this.isOnlineMode ? 'online' : 'offline'} ativado`);
  },

  async register(userData) {
    try {      if (this.isOnlineMode) {
        // Modo online - usar backend real
        const response = await makeRequest(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          body: JSON.stringify({
            name: userData.name || userData.username, // Backend espera 'name'
            email: userData.email,
            password: userData.password,
            country: userData.country,
            countryName: userData.countryName,
            newsCountryCode: userData.newsCountryCode
          })
        });

        // Salvar token e dados do usuário
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return response;
      } else {
        // Modo offline - usar localStorage
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
      }
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
      if (this.isOnlineMode) {
        // Modo online - usar backend real
        const response = await makeRequest(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password
          })
        });

        // Salvar token e dados do usuário
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return response;
      } else {
        // Modo offline - usar localStorage
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          throw new Error('Nenhum usuário registrado. Crie uma conta primeiro.');
        }
        
        const user = JSON.parse(savedUser);
        const token = btoa(JSON.stringify({ userId: user.id, username: user.username }));
        
        localStorage.setItem('token', token);
        
        return { token, user, message: 'Login realizado com sucesso (modo offline)' };
      }
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
  },

  // CRUD Operations for User Profile
  
  async getUserProfile() {
    try {
      // Em modo offline, obter do localStorage
      const user = this.getUser();
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Combinar dados do usuário com preferências
      const preferences = localStorage.getItem('userPreferences');
      const userPrefs = preferences ? JSON.parse(preferences) : {};
      
      return {
        ...user,
        ...userPrefs,
        profileImage: user.profileImage || '',
        language: userPrefs.language || 'pt',
        timezone: userPrefs.timezone || 'Europe/Lisbon',
        notifications: userPrefs.notifications !== false,
        defaultPriority: userPrefs.defaultPriority || 'média'
      };
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      throw error;
    }
  },
  async updateUserInfo(userData) {
    try {
      if (this.isOnlineMode) {
        // Modo online - usar backend real
        const response = await makeRequest(`${API_BASE_URL}/auth/profile`, {
          method: 'PUT',
          body: JSON.stringify(userData)
        });

        // Atualizar dados locais com a resposta do servidor
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Atualizar preferências se fornecidas
        if (userData.language || userData.timezone || userData.notifications !== undefined || 
            userData.defaultPriority || userData.darkMode !== undefined) {
          const currentPrefs = localStorage.getItem('userPreferences');
          const preferences = currentPrefs ? JSON.parse(currentPrefs) : {};
          
          const updatedPreferences = {
            ...preferences,
            language: userData.language || preferences.language,
            timezone: userData.timezone || preferences.timezone,
            notifications: userData.notifications !== undefined ? userData.notifications : preferences.notifications,
            defaultPriority: userData.defaultPriority || preferences.defaultPriority,
            darkMode: userData.darkMode !== undefined ? userData.darkMode : preferences.darkMode
          };
          
          localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));
        }

        return response;
      } else {
        // Modo offline - validar dados básicos
        if (userData.username && userData.username.length < 3) {
          throw new Error('Nome de usuário deve ter pelo menos 3 caracteres');
        }
        
        if (userData.email && !/^\S+@\S+\.\S+$/.test(userData.email)) {
          throw new Error('Email inválido');
        }

        // Obter usuário atual
        const currentUser = this.getUser();
        if (!currentUser) {
          throw new Error('Usuário não encontrado');
        }

        // Atualizar dados do usuário
        const updatedUser = {
          ...currentUser,
          username: userData.username || currentUser.username,
          email: userData.email || currentUser.email,
          profileImage: userData.profileImage !== undefined ? userData.profileImage : currentUser.profileImage,
          country: userData.country || currentUser.country,
          countryName: userData.countryName || currentUser.countryName,
          newsCountryCode: userData.newsCountryCode || currentUser.newsCountryCode,
          updatedAt: new Date().toISOString()
        };

        // Atualizar preferências
        const currentPrefs = localStorage.getItem('userPreferences');
        const preferences = currentPrefs ? JSON.parse(currentPrefs) : {};
        
        const updatedPreferences = {
          ...preferences,
          language: userData.language || preferences.language,
          timezone: userData.timezone || preferences.timezone,
          notifications: userData.notifications !== undefined ? userData.notifications : preferences.notifications,
          defaultPriority: userData.defaultPriority || preferences.defaultPriority,
          darkMode: userData.darkMode !== undefined ? userData.darkMode : preferences.darkMode
        };

        // Salvar no localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));

        return {
          message: 'Perfil atualizado com sucesso',
          user: { ...updatedUser, ...updatedPreferences }
        };
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  },
  async changePassword(currentPassword, newPassword) {
    try {
      // Validações básicas
      if (!currentPassword || !newPassword) {
        throw new Error('Senha atual e nova senha são obrigatórias');
      }

      if (newPassword.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres');
      }

      if (this.isOnlineMode) {
        // Modo online - usar backend real
        const response = await makeRequest(`${API_BASE_URL}/auth/change-password`, {
          method: 'PUT',
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        });

        return response;
      } else {
        // Modo offline - simular verificação da senha atual
        console.log('Validando alteração de senha...');
        
        // Simular delay de processamento
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Para demonstração, consideramos que a senha atual está correta
        return {
          message: 'Senha alterada com sucesso'
        };
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }
  },

  async deleteAccount() {
    try {
      // Confirmar ação crítica
      const user = this.getUser();
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Remover todos os dados do usuário
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('tasks');
      
      // Limpar outros dados relacionados
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('user_') || key.startsWith('task_')) {
          localStorage.removeItem(key);
        }
      });

      return {
        message: 'Conta eliminada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao eliminar conta:', error);
      throw error;
    }
  },

  async logoutAllSessions() {
    try {
      // Em modo offline, apenas remove o token atual
      // Em produção, invalidaria todos os tokens no servidor
      this.logout();
      
      return {
        message: 'Todas as sessões foram terminadas'
      };
    } catch (error) {
      console.error('Erro ao terminar sessões:', error);
      throw error;
    }
  },

  async exportUserData(format = 'json') {
    try {
      const user = this.getUser();
      const preferences = localStorage.getItem('userPreferences');
      const tasks = localStorage.getItem('tasks');
      
      const userData = {
        user: user,
        preferences: preferences ? JSON.parse(preferences) : {},
        tasks: tasks ? JSON.parse(tasks) : [],
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      if (format === 'json') {
        return JSON.stringify(userData, null, 2);
      } else if (format === 'csv') {
        // Converter dados para CSV
        let csv = 'Tipo,Campo,Valor\n';
        
        // Dados do usuário
        Object.entries(user || {}).forEach(([key, value]) => {
          csv += `Usuário,"${key}","${value}"\n`;
        });
        
        // Preferências
        const prefs = preferences ? JSON.parse(preferences) : {};
        Object.entries(prefs).forEach(([key, value]) => {
          csv += `Preferências,"${key}","${value}"\n`;
        });
        
        // Tarefas (resumo)
        const taskList = tasks ? JSON.parse(tasks) : [];
        taskList.forEach((task, index) => {
          csv += `Tarefa ${index + 1},"título","${task.title || ''}"\n`;
          csv += `Tarefa ${index + 1},"status","${task.status || ''}"\n`;
          csv += `Tarefa ${index + 1},"prioridade","${task.priority || ''}"\n`;
        });
        
        return csv;
      }
      
      throw new Error('Formato não suportado');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw error;
    }
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

  async exportData(format = 'json') {
    try {
      const tasks = storageService.getTasks();
      const user = authService.getUser();
      const preferences = localStorage.getItem('userPreferences');
      
      const exportData = {
        tasks: tasks,
        user: user,
        preferences: preferences ? JSON.parse(preferences) : {},
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      } else if (format === 'csv') {
        // Converter tarefas para CSV
        let csv = 'ID,Título,Descrição,Status,Prioridade,Categoria,Data Criação,Data Prazo,Tags\n';
        
        tasks.forEach(task => {
          const row = [
            task._id || '',
            `"${(task.title || '').replace(/"/g, '""')}"`,
            `"${(task.description || '').replace(/"/g, '""')}"`,
            task.status || '',
            task.priority || '',
            task.category || '',
            task.createdAt || '',
            task.dueDate || '',
            `"${(task.tags || []).join(', ')}"`
          ].join(',');
          csv += row + '\n';
        });
        
        return csv;
      }
      
      throw new Error('Formato não suportado');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw error;
    }
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

// Events Service for agenda management
const eventsService = {
  async getEvents() {
    try {
      if (authService.isOnlineMode) {
        // Modo online - usar backend real
        const response = await makeRequest(`${API_BASE_URL}/events`);
        return response.events || [];
      } else {
        // Modo offline - usar localStorage
        const events = localStorage.getItem('agenda_events');
        return events ? JSON.parse(events) : [];
      }
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
  },

  async saveEvents(events) {
    try {
      if (authService.isOnlineMode) {
        // Em modo online, cada evento é salvo individualmente via API
        // Esta função é mais para modo offline
        localStorage.setItem('agenda_events', JSON.stringify(events));
      } else {
        localStorage.setItem('agenda_events', JSON.stringify(events));
      }
    } catch (error) {
      console.error('Erro ao salvar eventos:', error);
    }
  },

  async addEvent(eventData) {
    try {
      if (authService.isOnlineMode) {
        // Modo online - usar backend real
        const response = await makeRequest(`${API_BASE_URL}/events`, {
          method: 'POST',
          body: JSON.stringify(eventData)
        });
        return response.event;
      } else {
        // Modo offline - usar localStorage
        const events = await this.getEvents();
        const newEvent = {
          id: Date.now(),
          title: eventData.title || '',
          description: eventData.description || '',
          date: eventData.date || '',
          time: eventData.time || '',
          type: eventData.type || 'event',
          priority: eventData.priority || 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: authService.getUser()?.id || null
        };
        
        events.push(newEvent);
        await this.saveEvents(events);
        return newEvent;
      }
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      throw error;
    }
  },

  async updateEvent(eventId, updateData) {
    try {
      if (authService.isOnlineMode) {
        // Modo online - usar backend real
        const response = await makeRequest(`${API_BASE_URL}/events/${eventId}`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        });
        return response.event;
      } else {
        // Modo offline - usar localStorage
        const events = await this.getEvents();
        const eventIndex = events.findIndex(event => event.id === eventId);
        
        if (eventIndex === -1) {
          throw new Error('Evento não encontrado');
        }

        events[eventIndex] = {
          ...events[eventIndex],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        
        await this.saveEvents(events);
        return events[eventIndex];
      }
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  },

  async deleteEvent(eventId) {
    try {
      if (authService.isOnlineMode) {
        // Modo online - usar backend real
        const response = await makeRequest(`${API_BASE_URL}/events/${eventId}`, {
          method: 'DELETE'
        });
        return response;
      } else {
        // Modo offline - usar localStorage
        const events = await this.getEvents();
        const filteredEvents = events.filter(event => event.id !== eventId);
        await this.saveEvents(filteredEvents);
        return { message: 'Evento eliminado com sucesso' };
      }
    } catch (error) {
      console.error('Erro ao eliminar evento:', error);
      throw error;
    }
  },

  async getEventsByDate(date) {
    try {
      if (authService.isOnlineMode) {
        // Modo online - usar backend real
        const response = await makeRequest(`${API_BASE_URL}/events?date=${date}`);
        return response.events || [];
      } else {
        // Modo offline - filtrar eventos locais
        const events = await this.getEvents();
        return events.filter(event => event.date === date)
                     .sort((a, b) => a.time.localeCompare(b.time));
      }
    } catch (error) {
      console.error('Erro ao buscar eventos por data:', error);
      return [];
    }
  },

  async getEventsByDateRange(startDate, endDate) {
    try {
      if (authService.isOnlineMode) {
        // Modo online - usar backend real
        const response = await makeRequest(`${API_BASE_URL}/events?startDate=${startDate}&endDate=${endDate}`);
        return response.events || [];
      } else {
        // Modo offline - filtrar eventos locais
        const events = await this.getEvents();
        return events.filter(event => {
          return event.date >= startDate && event.date <= endDate;
        }).sort((a, b) => {
          if (a.date === b.date) {
            return a.time.localeCompare(b.time);
          }
          return a.date.localeCompare(b.date);
        });
      }
    } catch (error) {
      console.error('Erro ao buscar eventos por intervalo:', error);
      return [];
    }
  },

  async getTodayEvents() {
    const today = new Date().toISOString().split('T')[0];
    return await this.getEventsByDate(today);
  },

  async getUpcomingEvents(days = 7) {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const startDate = today.toISOString().split('T')[0];
    const endDate = futureDate.toISOString().split('T')[0];
    
    return await this.getEventsByDateRange(startDate, endDate);
  },

  async hasEventsOnDate(date) {
    const events = await this.getEventsByDate(date);
    return events.length > 0;
  },

  async getEventStats() {
    try {
      if (authService.isOnlineMode) {
        // Modo online - usar endpoint de estatísticas
        const response = await makeRequest(`${API_BASE_URL}/events/stats`);
        return response.stats;
      } else {
        // Modo offline - calcular estatísticas localmente
        const events = await this.getEvents();
        const today = new Date().toISOString().split('T')[0];
        
        return {
          total: events.length,
          today: events.filter(e => e.date === today).length,
          upcoming: events.filter(e => e.date > today).length,
          past: events.filter(e => e.date < today).length,
          byType: events.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
          }, {}),
          byPriority: events.reduce((acc, event) => {
            acc[event.priority] = (acc[event.priority] || 0) + 1;
            return acc;
          }, {})
        };
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        total: 0,
        today: 0,
        upcoming: 0,
        past: 0,
        byType: {},
        byPriority: {}
      };
    }
  },

  exportEvents(format = 'json') {
    // Esta função sempre usa dados locais para exportação
    const events = localStorage.getItem('agenda_events');
    const eventsData = events ? JSON.parse(events) : [];
    
    if (format === 'json') {
      return JSON.stringify(eventsData, null, 2);
    } else if (format === 'csv') {
      let csv = 'ID,Título,Descrição,Data,Hora,Tipo,Prioridade\n';
      eventsData.forEach(event => {
        csv += `${event.id},"${event.title}","${event.description || ''}",${event.date},${event.time},${event.type},${event.priority}\n`;
      });
      return csv;
    }
    
    throw new Error('Formato não suportado');
  },

  async importEvents(eventsData) {
    try {
      const events = Array.isArray(eventsData) ? eventsData : JSON.parse(eventsData);
      
      // Validar estrutura dos eventos
      const validEvents = events.filter(event => 
        event.title && event.date && event.time
      ).map(event => ({
        ...event,
        id: event.id || Date.now() + Math.random(),
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      if (authService.isOnlineMode) {
        // Modo online - criar eventos via API
        const response = await makeRequest(`${API_BASE_URL}/events/bulk`, {
          method: 'POST',
          body: JSON.stringify({ events: validEvents })
        });
        return response.events;
      } else {
        // Modo offline - salvar diretamente
        await this.saveEvents(validEvents);
        return validEvents;
      }
    } catch (error) {
      console.error('Erro ao importar eventos:', error);
      throw new Error('Erro ao importar eventos: ' + error.message);
    }
  },

  clearAllEvents() {
    if (confirm('Tem certeza que deseja eliminar TODOS os eventos? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('agenda_events');
      return true;
    }
    return false;
  }
};

// Export for use in HTML
window.authService = authService;
window.tasksService = tasksService;
window.storageService = storageService;
window.taskValidationService = taskValidationService;
window.eventsService = eventsService;
window.eventsService = eventsService;

// Inicializar o serviço de autenticação quando a página carrega
document.addEventListener('DOMContentLoaded', async () => {
  await authService.initialize();
});

// Para caso o script seja carregado após o DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await authService.initialize();
  });
} else {
  authService.initialize();
}
window.taskValidationService = taskValidationService;
