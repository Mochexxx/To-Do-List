const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  startDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['baixa', 'média', 'alta', 'urgente'],
    default: 'média'
  },
  status: {
    type: String,
    enum: ['pendente', 'em progresso', 'concluída'],
    default: 'pendente'
  },
  category: {
    type: String,
    enum: ['pessoal', 'trabalho', 'estudos', 'saude', 'financas'],
    default: 'pessoal'
  },
  isRecurrent: {
    type: Boolean,
    default: false
  },
  recurringType: {
    type: String,
    enum: ['diária', 'semanal', 'mensal', 'anual'],
    required: function() { return this.isRecurrent; }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  estimatedDuration: {
    type: String,
    enum: ['15min', '30min', '1h', '2h', '4h', '8h', '1d+'],
    default: ''
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
  
  // Converter status antigo para novo formato
  if (update.status === 'em_progresso') {
    update.status = 'em progresso';
  }
  
  next();
});

module.exports = mongoose.model('Task', taskSchema);
