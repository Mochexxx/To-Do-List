const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  startDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['baixa', 'média', 'alta'],
    default: 'média'
  },
  status: {
    type: String,
    enum: ['pendente', 'em_progresso', 'concluída'],
    default: 'pendente'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringType: {
    type: String,
    enum: ['diária', 'semanal', 'mensal', 'anual'],
    required: function() { return this.isRecurring; }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  estimatedDuration: {
    type: Number, // em minutos
    min: 1
  },
  // Campos de compatibilidade
  completed: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Middleware para sincronizar status com completed
taskSchema.pre('save', function(next) {
  if (this.status === 'concluída') {
    this.completed = true;
  } else {
    this.completed = false;
  }
  next();
});

// Middleware para atualizar status quando completed muda
taskSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.completed !== undefined) {
    if (update.completed) {
      update.status = 'concluída';
    } else if (!update.status || update.status === 'concluída') {
      update.status = 'pendente';
    }
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
