const express = require('express');
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token necessário.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// GET /events - Obter todos os eventos do usuário
router.get('/', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, date } = req.query;
    let events;

    if (date) {
      // Buscar eventos de uma data específica
      events = await Event.getEventsByDate(req.user.userId, date);
    } else if (startDate && endDate) {
      // Buscar eventos em um intervalo de datas
      events = await Event.getEventsByDateRange(req.user.userId, startDate, endDate);
    } else {
      // Buscar todos os eventos do usuário
      events = await Event.find({ userId: req.user.userId, isActive: true })
                          .sort({ date: 1, time: 1 });
    }

    res.json({
      message: 'Eventos obtidos com sucesso',
      events,
      count: events.length
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao buscar eventos', 
      error: error.message 
    });
  }
});

// GET /events/:id - Obter um evento específico
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId,
      isActive: true 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    res.json({
      message: 'Evento obtido com sucesso',
      event
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao buscar evento', 
      error: error.message 
    });
  }
});

// POST /events - Criar novo evento
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      type,
      priority,
      isRecurring,
      recurringType,
      recurringEndDate,
      location,
      attendees,
      tags,
      color,
      isAllDay,
      endTime,
      notificationMinutes
    } = req.body;

    // Validações básicas
    if (!title || !date || !time) {
      return res.status(400).json({ 
        message: 'Título, data e hora são obrigatórios' 
      });
    }

    // Verificar se a data não é no passado (opcional)
    const eventDateTime = new Date(`${date}T${time}:00`);
    const now = new Date();
    
    // Permitir eventos no passado mas avisar
    const isPast = eventDateTime < now;

    const event = new Event({
      title,
      description,
      date,
      time,
      type: type || 'event',
      priority: priority || 'medium',
      isRecurring: isRecurring || false,
      recurringType,
      recurringEndDate,
      location,
      attendees,
      tags,
      color: color || '#007bff',
      isAllDay: isAllDay || false,
      endTime,
      notificationMinutes: notificationMinutes || 15,
      userId: req.user.userId
    });

    await event.save();

    res.status(201).json({
      message: `Evento criado com sucesso${isPast ? ' (evento no passado)' : ''}`,
      event,
      isPast
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ 
      message: 'Erro ao criar evento', 
      error: error.message 
    });
  }
});

// PUT /events/:id - Atualizar evento
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      type,
      priority,
      isRecurring,
      recurringType,
      recurringEndDate,
      location,
      attendees,
      tags,
      color,
      isAllDay,
      endTime,
      notificationMinutes,
      isCompleted
    } = req.body;

    const event = await Event.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId,
      isActive: true 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    // Atualizar campos fornecidos
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (time !== undefined) event.time = time;
    if (type !== undefined) event.type = type;
    if (priority !== undefined) event.priority = priority;
    if (isRecurring !== undefined) event.isRecurring = isRecurring;
    if (recurringType !== undefined) event.recurringType = recurringType;
    if (recurringEndDate !== undefined) event.recurringEndDate = recurringEndDate;
    if (location !== undefined) event.location = location;
    if (attendees !== undefined) event.attendees = attendees;
    if (tags !== undefined) event.tags = tags;
    if (color !== undefined) event.color = color;
    if (isAllDay !== undefined) event.isAllDay = isAllDay;
    if (endTime !== undefined) event.endTime = endTime;
    if (notificationMinutes !== undefined) event.notificationMinutes = notificationMinutes;
    if (isCompleted !== undefined) event.isCompleted = isCompleted;

    await event.save();

    res.json({
      message: 'Evento atualizado com sucesso',
      event
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ 
      message: 'Erro ao atualizar evento', 
      error: error.message 
    });
  }
});

// DELETE /events/:id - Eliminar evento
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId,
      isActive: true 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    // Soft delete - marcar como inativo
    event.isActive = false;
    await event.save();

    res.json({
      message: 'Evento eliminado com sucesso'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao eliminar evento', 
      error: error.message 
    });
  }
});

// GET /events/stats - Obter estatísticas dos eventos
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user.userId, isActive: true });
    const today = new Date().toISOString().split('T')[0];
    
    const stats = {
      total: events.length,
      today: events.filter(e => e.date === today).length,
      upcoming: events.filter(e => e.date > today).length,
      past: events.filter(e => e.date < today).length,
      completed: events.filter(e => e.isCompleted).length,
      byType: {},
      byPriority: {},
      byMonth: {}
    };

    // Contar por tipo
    events.forEach(event => {
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
      stats.byPriority[event.priority] = (stats.byPriority[event.priority] || 0) + 1;
      
      const month = event.date.substring(0, 7); // YYYY-MM
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
    });

    res.json({
      message: 'Estatísticas obtidas com sucesso',
      stats
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao obter estatísticas', 
      error: error.message 
    });
  }
});

// POST /events/bulk - Criar múltiplos eventos (para eventos recorrentes)
router.post('/bulk', verifyToken, async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ message: 'Array de eventos é obrigatório' });
    }

    const createdEvents = [];
    const errors = [];

    for (let i = 0; i < events.length; i++) {
      try {
        const eventData = {
          ...events[i],
          userId: req.user.userId
        };
        
        const event = new Event(eventData);
        await event.save();
        createdEvents.push(event);
      } catch (error) {
        errors.push({
          index: i,
          error: error.message
        });
      }
    }

    res.status(201).json({
      message: `${createdEvents.length} eventos criados com sucesso`,
      events: createdEvents,
      errors: errors.length > 0 ? errors : undefined,
      created: createdEvents.length,
      failed: errors.length
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao criar eventos em lote', 
      error: error.message 
    });
  }
});

module.exports = router;
