const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // Campos adicionais para perfil completo
  profileImage: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },
  countryName: {
    type: String,
    default: ''
  },
  newsCountryCode: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'pt',
    enum: ['pt', 'en', 'es', 'fr']
  },
  timezone: {
    type: String,
    default: 'Europe/Lisbon'
  },
  notifications: {
    type: Boolean,
    default: true
  },
  defaultPriority: {
    type: String,
    default: 'média',
    enum: ['baixa', 'média', 'alta', 'urgente']
  },
  darkMode: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public user data (without password)
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
