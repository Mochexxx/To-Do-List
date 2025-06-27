// Serviço de Notificações
const notificationsService = {
  // Status da permissão
  permission: null,

  // Configurações padrão
  defaultSettings: {
    enabled: true,
    tasks: {
      enabled: true,
      beforeDue: [15, 60, 1440], // 15min, 1h, 1 dia antes
      onlyUrgent: false
    },
    events: {
      enabled: true,
      beforeStart: [15, 60], // 15min, 1h antes
      allEvents: true
    },
    news: {
      enabled: false,
      categories: ['technology', 'business'],
      frequency: 'daily' // daily, weekly
    },
    sound: {
      enabled: true,
      type: 'default' // default, custom
    },
    desktop: {
      enabled: true,
      duration: 5000 // 5 segundos
    }
  },

  // Inicializar serviço
  async initialize() {
    console.log('🔔 Inicializando serviço de notificações...');
    
    // Verificar suporte do browser
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser não suporta notificações');
      this.permission = 'unsupported';
      return false;
    }

    // Verificar permissão atual
    this.permission = Notification.permission;
    console.log('🔔 Permissão atual:', this.permission);

    // Carregar configurações
    this.loadSettings();

    // Iniciar verificação periódica
    this.startPeriodicCheck();

    return this.permission === 'granted';
  },

  // Solicitar permissão
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('Browser não suporta notificações');
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      console.log('🔔 Nova permissão:', permission);
      
      if (permission === 'granted') {
        this.showWelcomeNotification();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      return false;
    }
  },

  // Notificação de boas-vindas
  showWelcomeNotification() {
    this.show({
      title: '🎉 Notificações Ativadas!',
      body: 'Você receberá lembretes sobre tarefas e eventos importantes.',
      icon: '🔔',
      tag: 'welcome',
      requireInteraction: false
    });
  },

  // Mostrar notificação
  show(options) {
    if (this.permission !== 'granted') {
      console.warn('⚠️ Permissão de notificação não concedida');
      return null;
    }

    const settings = this.getSettings();
    if (!settings.enabled || !settings.desktop.enabled) {
      console.log('🔕 Notificações desktop desabilitadas');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: this.getIconDataUrl(options.icon),
        tag: options.tag || 'default',
        requireInteraction: options.requireInteraction || false,
        silent: !settings.sound.enabled
      });

      // Auto-close após duração configurada
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, settings.desktop.duration);
      }

      // Event listeners
      notification.onclick = () => {
        window.focus();
        if (options.onClick) options.onClick();
        notification.close();
      };

      notification.onshow = () => {
        if (settings.sound.enabled) {
          this.playNotificationSound();
        }
      };

      this.logNotification(options);
      return notification;

    } catch (error) {
      console.error('❌ Erro ao mostrar notificação:', error);
      return null;
    }
  },

  // Converter emoji para data URL (ícone)
  getIconDataUrl(emoji) {
    if (!emoji) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 32, 32);
    
    return canvas.toDataURL();
  },

  // Tocar som de notificação
  playNotificationSound() {
    try {
      // Som simples usando AudioContext
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('⚠️ Não foi possível tocar som:', error);
    }
  },

  // Verificar tarefas próximas do prazo
  async checkUpcomingTasks() {
    try {
      const settings = this.getSettings();
      if (!settings.enabled || !settings.tasks.enabled) return;

      const tasks = await window.tasksService?.getTasks() || [];
      const now = new Date();

      tasks.forEach(task => {
        if (task.status === 'concluída' || !task.dueDate) return;

        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        // Verificar se está dentro dos intervalos configurados
        settings.tasks.beforeDue.forEach(minutes => {
          if (Math.abs(minutesDiff - minutes) < 5) { // Margem de 5 minutos
            const isUrgent = task.priority === 'urgente' || task.priority === 'alta';
            
            if (!settings.tasks.onlyUrgent || isUrgent) {
              this.showTaskNotification(task, minutes);
            }
          }
        });
      });
    } catch (error) {
      console.error('❌ Erro ao verificar tarefas:', error);
    }
  },

  // Verificar eventos próximos
  async checkUpcomingEvents() {
    try {
      const settings = this.getSettings();
      if (!settings.enabled || !settings.events.enabled) return;

      const events = await window.eventsService?.getEvents() || [];
      const now = new Date();

      events.forEach(event => {
        if (!event.date || !event.time) return;

        const eventDateTime = new Date(`${event.date}T${event.time}:00`);
        const timeDiff = eventDateTime.getTime() - now.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        // Verificar se está dentro dos intervalos configurados
        settings.events.beforeStart.forEach(minutes => {
          if (Math.abs(minutesDiff - minutes) < 5) { // Margem de 5 minutos
            this.showEventNotification(event, minutes);
          }
        });
      });
    } catch (error) {
      console.error('❌ Erro ao verificar eventos:', error);
    }
  },

  // Notificação de tarefa
  showTaskNotification(task, minutesBefore) {
    const priorityEmojis = {
      'baixa': '🟢',
      'média': '🟡', 
      'alta': '🟠',
      'urgente': '🔴'
    };

    const timeText = minutesBefore < 60 
      ? `${minutesBefore} minutos`
      : minutesBefore < 1440 
        ? `${Math.floor(minutesBefore / 60)} horas`
        : `${Math.floor(minutesBefore / 1440)} dias`;

    this.show({
      title: `${priorityEmojis[task.priority]} Tarefa: ${task.title}`,
      body: `Prazo em ${timeText}\n${task.description || ''}`,
      icon: '📋',
      tag: `task-${task._id}`,
      type: 'task',
      taskId: task._id,
      priority: task.priority,
      dueDate: task.dueDate,
      requireInteraction: task.priority === 'urgente',
      onClick: () => {
        // Navegar para a tarefa
        if (window.navigateToTask) {
          window.navigateToTask(task._id);
        }
      }
    });
  },

  // Notificação de evento
  showEventNotification(event, minutesBefore) {
    const typeEmojis = {
      'event': '📅',
      'meeting': '🤝',
      'task': '✅',
      'reminder': '🔔',
      'presentation': '📊',
      'appointment': '👨‍⚕️',
      'birthday': '🎂',
      'holiday': '🏖️'
    };

    const timeText = minutesBefore < 60 
      ? `${minutesBefore} minutos`
      : `${Math.floor(minutesBefore / 60)} horas`;

    this.show({
      title: `${typeEmojis[event.type]} ${event.title}`,
      body: `Início em ${timeText} (${event.time})\n${event.description || ''}`,
      icon: '📅',
      tag: `event-${event.id}`,
      type: 'event',
      eventId: event.id,
      eventDate: event.date,
      eventTime: event.time,
      requireInteraction: event.priority === 'high',
      onClick: () => {
        // Navegar para a agenda
        if (window.navigateToAgenda) {
          window.navigateToAgenda(event.date);
        }
      }
    });
  },

  // Verificação periódica
  startPeriodicCheck() {
    // Verificar a cada 5 minutos
    setInterval(() => {
      this.checkUpcomingTasks();
      this.checkUpcomingEvents();
    }, 5 * 60 * 1000);

    // Primeira verificação após 10 segundos
    setTimeout(() => {
      this.checkUpcomingTasks();
      this.checkUpcomingEvents();
    }, 10000);
  },

  // Configurações
  getSettings() {
    try {
      const saved = localStorage.getItem('notificationSettings');
      return saved ? { ...this.defaultSettings, ...JSON.parse(saved) } : this.defaultSettings;
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
      return this.defaultSettings;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      console.log('✅ Configurações de notificação salvas');
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
    }
  },

  loadSettings() {
    const settings = this.getSettings();
    console.log('📋 Configurações carregadas:', settings);
    return settings;
  },

  // Log de notificações
  logNotification(notification) {
    try {
      const logs = JSON.parse(localStorage.getItem('notificationLogs') || '[]');
      logs.unshift({
        ...notification,
        timestamp: new Date().toISOString(),
        id: Date.now(),
        read: false // Marcar como não lida por padrão
      });
      
      // Manter apenas os últimos 100 logs
      if (logs.length > 100) {
        logs.splice(100);
      }
      
      localStorage.setItem('notificationLogs', JSON.stringify(logs));
      
      // Atualizar contador se a função existir
      if (window.updateUnreadNotifications) {
        window.updateUnreadNotifications();
      }

      // Disparar evento customizado para atualizar o centro de notificações
      window.dispatchEvent(new CustomEvent('notificationAdded', {
        detail: notification
      }));
    } catch (error) {
      console.error('❌ Erro ao salvar log:', error);
    }
  },

  // Obter histórico de notificações
  getNotificationHistory() {
    try {
      return JSON.parse(localStorage.getItem('notificationLogs') || '[]');
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
      return [];
    }
  },

  // Limpar histórico
  clearHistory() {
    localStorage.removeItem('notificationLogs');
  },

  // Teste de notificação
  testNotification() {
    this.show({
      title: '🧪 Teste de Notificação',
      body: 'Se você vê esta mensagem, as notificações estão funcionando!',
      icon: '✅',
      tag: 'test',
      type: 'test',
      requireInteraction: true
    });
  }
};

// Exportar para uso global
window.notificationsService = notificationsService;
