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
    const { title, description, dueDate, priority } = req.body;
    
    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      userId: req.user.userId
    });

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

module.exports = router;
