const express = require('express');
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');

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

// Get all tasks for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar tarefas', error: error.message });
  }
});

// Create new task
router.post('/', verifyToken, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      startDate,
      dueDate, 
      priority, 
      category,
      status,
      isRecurrent,
      recurringType,
      tags,
      estimatedDuration
    } = req.body;
    
    const taskData = {
      title,
      userId: req.user.userId
    };
    
    // Adicionar campos opcionais apenas se fornecidos
    if (description) taskData.description = description;
    if (startDate) taskData.startDate = startDate;
    if (dueDate) taskData.dueDate = dueDate;
    if (priority) taskData.priority = priority;
    if (category) taskData.category = category;
    if (status) taskData.status = status;
    if (isRecurrent !== undefined) taskData.isRecurrent = isRecurrent;
    if (recurringType) taskData.recurringType = recurringType;
    if (tags && Array.isArray(tags)) taskData.tags = tags;
    if (estimatedDuration) taskData.estimatedDuration = estimatedDuration;
    
    const task = new Task(taskData);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar tarefa', error: error.message });
  }
});

// Update task
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar tarefa', error: error.message });
  }
});

// Delete task
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    res.json({ message: 'Tarefa deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar tarefa', error: error.message });
  }
});

// Get task statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const tasks = await Task.find({ userId });
    const now = new Date();
    
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'concluída').length,
      pending: tasks.filter(t => t.status === 'pendente').length,
      inProgress: tasks.filter(t => t.status === 'em progresso').length,
      overdue: tasks.filter(t => {
        return t.dueDate && new Date(t.dueDate) < now && t.status !== 'concluída';
      }).length,
      
      priorities: {
        baixa: tasks.filter(t => t.priority === 'baixa').length,
        média: tasks.filter(t => t.priority === 'média').length,
        alta: tasks.filter(t => t.priority === 'alta').length,
        urgente: tasks.filter(t => t.priority === 'urgente').length
      },
      
      categories: {
        pessoal: tasks.filter(t => t.category === 'pessoal').length,
        trabalho: tasks.filter(t => t.category === 'trabalho').length,
        estudos: tasks.filter(t => t.category === 'estudos').length,
        saude: tasks.filter(t => t.category === 'saude').length,
        financas: tasks.filter(t => t.category === 'financas').length
      },
      
      recurrent: tasks.filter(t => t.isRecurrent === true).length,
      
      topTags: getTopTags(tasks, 5)
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
  }
});

// Helper function for top tags
function getTopTags(tasks, limit = 5) {
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
}

module.exports = router;
