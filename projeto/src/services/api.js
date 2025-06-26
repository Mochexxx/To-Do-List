const API_BASE_URL = 'http://localhost:5000/api';

// Função para verificar se o backend está disponível
const checkBackendConnectivity = async () => {
  try {
    console.log('Testando conectividade com backend...');
    const response = await fetch('http://localhost:5000/', { 
      method: 'GET',
      timeout: 3000 
    });
    console.log('Backend response:', response.ok, response.status);
    return response.ok;
  } catch (error) {
    console.log('Backend não disponível, usando modo offline:', error.message);
    return false;
  }
};

// Helper function para fazer requisições HTTP
const makeRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  console.log('🌐 makeRequest - Iniciando requisição');
  console.log('📍 URL:', url);
  console.log('⚙️ Method:', options.method || 'GET');
  console.log('🔑 Token presente:', !!token);
  if (token) {
    console.log('🔑 Token (primeiros 20 chars):', token.substring(0, 20) + '...');
  }
  
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

  console.log('📤 Headers finais:', {
    'Content-Type': finalOptions.headers['Content-Type'],
    'Authorization': finalOptions.headers['Authorization'] ? 'Bearer [TOKEN]' : 'Não presente'
  });
  console.log('📦 Body:', options.body);

  try {
    const response = await fetch(url, finalOptions);
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }
      
      // Se for erro 401, pode ser token inválido
      if (response.status === 401) {
        console.error('🚫 Erro de autenticação - token pode estar inválido ou expirado');
        console.error('🔑 Token atual:', token);
      }
      
      throw new Error(error.message || 'Erro na requisição');
    }
    
    const result = await response.json();
    console.log('✅ Response data:', result);
    return result;
  } catch (error) {
    console.error('💥 makeRequest - Erro:', error);
    throw error;
  }
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
  isOnlineMode: true, // Force online mode for backend integration
  async initialize() {
    console.log('🚀 authService.initialize - Iniciando verificação do backend');
    this.isOnlineMode = await checkBackendConnectivity();
    console.log(`🌐 Modo ${this.isOnlineMode ? 'online' : 'offline'} ativado`);
    
    // If backend is not available, show a warning but continue in offline mode
    if (!this.isOnlineMode) {
      console.warn('⚠️ Backend não disponível - dados não serão salvos no servidor');
      console.warn('💡 Para ativar o modo online:');
      console.warn('   1. Abra um terminal');
      console.warn('   2. cd backend');
      console.warn('   3. npm install');
      console.warn('   4. npm start');
    } else {
      console.log('✅ Backend conectado com sucesso!');
    }
  },
  async register(userData) {
    try {
      // Always try backend first
      const response = await makeRequest(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
          name: userData.username, // Backend expects 'name' field
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
    } catch (error) {
      console.error('Backend registration failed:', error);      // Fallback to offline mode only if backend completely fails
      const user = {
        id: Date.now().toString(),
        name: userData.username, // Use 'name' field to match backend structure
        username: userData.username, // Keep username for backward compatibility
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
      
      return { token, user, message: 'Registro realizado com sucesso (modo offline)!' };
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
  },  async login(credentials) {
    try {
      console.log('🔐 Tentando login:', credentials.email);
      
      // Always try backend first
      const response = await makeRequest(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      console.log('✅ Login backend bem-sucedido');
      // Salvar token e dados do usuário
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response;
    } catch (error) {
      console.error('❌ Backend login falhou:', error);
      console.log('🔄 Tentando modo offline...');
      
      // Fallback to offline mode only if backend completely fails
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        throw new Error('Nenhum usuário registrado. Crie uma conta primeiro.');
      }
      
      const user = JSON.parse(savedUser);
      
      // Verificar credenciais básicas em modo offline
      if (user.email !== credentials.email) {
        throw new Error('Email incorreto');
      }
      
      // Gerar token offline mais robusto
      const tokenPayload = {
        userId: user.id || user._id,
        username: user.username || user.name,
        email: user.email,
        iat: Math.floor(Date.now() / 1000), // issued at
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 dias
        mode: 'offline'
      };
      
      const token = btoa(JSON.stringify(tokenPayload));
      console.log('🎫 Token offline gerado:', token.substring(0, 20) + '...');
      
      localStorage.setItem('token', token);
      
      return { 
        token, 
        user, 
        message: 'Login realizado com sucesso (modo offline)',
        isOfflineMode: true
      };
    }
  },
  logout() {
    console.log('👋 Fazendo logout...');
    localStorage.removeItem('token');
    // Keep user data for future logins
  },

  clearInvalidToken() {
    console.log('🧹 Limpando token inválido...');
    localStorage.removeItem('token');
  },
  getToken() {
    return localStorage.getItem('token');
  },

  isTokenValid() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Tentar decodificar token offline
      const decoded = JSON.parse(atob(token));
      
      // Verificar se é token offline e se não expirou
      if (decoded.mode === 'offline' && decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (now > decoded.exp) {
          console.warn('🕐 Token offline expirado');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      // Se não conseguir decodificar, assumir que é token do backend (válido)
      return true;
    }
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!this.getToken() && this.isTokenValid();
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
      if (this.isOnlineMode) {        // Modo online - usar backend real
        const requestBody = {
          ...userData
        };
        
        // Mapear username para name se necessário para o backend
        if (userData.username) {
          requestBody.name = userData.username;
        }
        
        const response = await makeRequest(`${API_BASE_URL}/auth/profile`, {
          method: 'PUT',
          body: JSON.stringify(requestBody)
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
        }        // Atualizar dados do usuário
        const updatedUser = {
          ...currentUser,
          name: userData.username || currentUser.name || currentUser.username,
          username: userData.username || currentUser.username || currentUser.name,
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

// Tasks Service with backend integration and local storage fallback
const tasksService = {
  async getTasks() {
    try {
      console.log('Tentando buscar tarefas do backend...');
      // Try backend first
      const tasks = await makeRequest(`${API_BASE_URL}/tasks`, { method: 'GET' });
      console.log('Tarefas obtidas do backend:', tasks);
      return tasks;
    } catch (error) {
      console.warn('Backend unavailable, using local storage:', error.message);
      // Fallback to local storage
      return storageService.getTasks();
    }
  },  async createTask(taskData) {
    try {
      console.log('🔄 tasksService.createTask - Iniciando...');
      console.log('📊 Dados recebidos:', taskData);
      console.log('🌐 API URL:', `${API_BASE_URL}/tasks`);
      
      // Try backend first
      const task = await makeRequest(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      console.log('✅ Tarefa criada no backend:', task);
      return task;
    } catch (error) {
      console.warn('⚠️ Backend unavailable, using local storage:', error.message);
      console.error('Erro completo:', error);
      // Fallback to local storage
      const sanitizedData = taskValidationService.sanitizeTaskData(taskData);
      const validation = taskValidationService.validateTaskData(sanitizedData);
      if (!validation.isValid) {
        throw new Error('Dados inválidos: ' + validation.errors.join(', '));
      }
      const user = authService.getUser();
      const taskWithUser = {
        ...sanitizedData,
        userId: user?.id
      };
      return storageService.addTask(taskWithUser);
    }
  },
  async updateTask(taskId, taskData) {
    try {
      // Try backend first
      return await makeRequest(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(taskData)
      });
    } catch (error) {
      console.warn('Backend unavailable, using local storage:', error.message);
      // Fallback to local storage
      const sanitizedData = taskValidationService.sanitizeTaskData(taskData);
      if (taskData.title !== undefined) {
        const validation = taskValidationService.validateTaskData(sanitizedData);
        if (!validation.isValid) {
          throw new Error('Dados inválidos: ' + validation.errors.join(', '));
        }
      }
      return storageService.updateTask(taskId, sanitizedData);
    }
  },
  async deleteTask(taskId) {
    try {
      // Try backend first
      return await makeRequest(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('Backend unavailable, using local storage:', error.message);
      // Fallback to local storage
      return storageService.deleteTask(taskId);
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
const eventsService = {  async getEvents() {
    try {
      console.log('📋 eventsService.getEvents - Iniciando busca');
      console.log('🌐 Modo online:', authService.isOnlineMode);
      
      if (authService.isOnlineMode) {
        // Modo online - usar backend real
        console.log('📡 Buscando eventos do backend');
        const response = await makeRequest(`${API_BASE_URL}/events`);
        console.log('✅ Eventos recebidos do backend:', response);
        return response.events || [];
      } else {
        // Modo offline - usar localStorage
        console.log('💾 Buscando eventos do localStorage');
        const events = localStorage.getItem('agenda_events');
        const parsedEvents = events ? JSON.parse(events) : [];
        console.log('✅ Eventos do localStorage:', parsedEvents);
        return parsedEvents;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      // Fallback para localStorage se o backend falhar
      if (authService.isOnlineMode) {
        console.log('🔄 Fallback para localStorage devido ao erro');
        const events = localStorage.getItem('agenda_events');
        return events ? JSON.parse(events) : [];
      }
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
  },  async addEvent(eventData) {
    try {
      console.log('🎯 eventsService.addEvent - Dados recebidos:', eventData);
      console.log('🌐 Modo online:', authService.isOnlineMode);
      console.log('🔐 Token válido:', authService.isTokenValid());
      
      if (authService.isOnlineMode && authService.isTokenValid()) {
        // Modo online - usar backend real
        console.log('📡 Enviando para backend:', `${API_BASE_URL}/events`);
        try {
          const response = await makeRequest(`${API_BASE_URL}/events`, {
            method: 'POST',
            body: JSON.stringify(eventData)
          });
          console.log('✅ Resposta do backend:', response);
          return response.event;
        } catch (error) {
          console.error('❌ Erro do backend, fallback para modo offline:', error);
          
          // Se erro 401, token pode estar inválido - forçar modo offline
          if (error.message.includes('Token inválido') || error.message.includes('401')) {
            console.warn('🔄 Token inválido, salvando localmente');
          }
          
          // Fallback para localStorage
          throw error; // Re-throw para ser capturado pelo fallback abaixo
        }
      } else {
        console.log('💾 Salvando em modo offline (backend indisponível ou token inválido)');
      }
      
      // Modo offline - usar localStorage (ou fallback)
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
      console.log('✅ Evento salvo em modo offline:', newEvent);
      return newEvent;
      
    } catch (error) {
      console.error('❌ Erro em eventsService.addEvent:', error);
      
      // Se for erro de autenticação, tentar salvar offline
      if (error.message.includes('Token inválido') || error.message.includes('401')) {
        console.log('🔄 Tentando salvar offline devido a erro de autenticação...');
        
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
        console.log('✅ Evento salvo offline após erro de autenticação');
        return newEvent;
      }
      
      console.error('❌ Stack trace:', error.stack);
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
window.tasksService = tasksService; // Expose updated service to global scope
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
