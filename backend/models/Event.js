const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD']
  },
  time: {
    type: String, // HH:MM format
    required: true,
    match: [/^\d{2}:\d{2}$/, 'Hora deve estar no formato HH:MM']
  },
  type: {
    type: String,
    enum: ['event', 'meeting', 'task', 'reminder', 'presentation', 'appointment', 'birthday', 'holiday'],
    default: 'event'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: function() {
      return this.isRecurring;
    }
  },
  recurringEndDate: {
    type: String,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD']
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  attendees: [{
    name: String,
    email: String
  }],
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  color: {
    type: String,
    match: [/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal'],
    default: '#007bff'
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  endTime: {
    type: String,
    match: [/^\d{2}:\d{2}$/, 'Hora deve estar no formato HH:MM']
  },
  notificationMinutes: {
    type: Number,
    min: 0,
    max: 10080, // 1 week in minutes
    default: 15
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
eventSchema.index({ userId: 1, date: 1 });
eventSchema.index({ userId: 1, date: 1, time: 1 });
eventSchema.index({ userId: 1, isActive: 1 });

// Virtual for datetime combination
eventSchema.virtual('datetime').get(function() {
  return `${this.date}T${this.time}:00`;
});

// Virtual for formatted date
eventSchema.virtual('formattedDate').get(function() {
  const [year, month, day] = this.date.split('-');
  return new Date(year, month - 1, day).toLocaleDateString('pt-PT');
});

// Method to check if event is in the past
eventSchema.methods.isPast = function() {
  const eventDateTime = new Date(`${this.date}T${this.time}:00`);
  return eventDateTime < new Date();
};

// Method to check if event is today
eventSchema.methods.isToday = function() {
  const today = new Date().toISOString().split('T')[0];
  return this.date === today;
};

// Method to check if event is upcoming (within next 7 days)
eventSchema.methods.isUpcoming = function() {
  const eventDate = new Date(this.date);
  const today = new Date();
  const nextWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
  
  return eventDate >= today && eventDate <= nextWeek;
};

// Static method to get events for a specific date
eventSchema.statics.getEventsByDate = function(userId, date) {
  return this.find({ 
    userId, 
    date, 
    isActive: true 
  }).sort({ time: 1 });
};

// Static method to get events in date range
eventSchema.statics.getEventsByDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
    isActive: true
  }).sort({ date: 1, time: 1 });
};

// Pre-save middleware
eventSchema.pre('save', function(next) {
  // Auto-complete past events if needed
  if (this.isPast() && !this.isCompleted && this.type === 'task') {
    // Don't auto-complete, but could add logic here
  }
  
  // Set completedAt if marking as completed
  if (this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Clear completedAt if unmarking as completed
  if (!this.isCompleted && this.completedAt) {
    this.completedAt = undefined;
  }
  
  next();
});

// Export the model
module.exports = mongoose.model('Event', eventSchema);
