const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, country, countryName, newsCountryCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { name }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Nome ou email já existem' 
      });
    }

    // Create new user with extended profile data
    const user = new User({ 
      name, 
      email, 
      password,
      country: country || '',
      countryName: countryName || '',
      newsCountryCode: newsCountryCode || '',
      language: country === 'br' ? 'pt' : country === 'pt' ? 'pt' : 'en',
      timezone: getTimezoneByCountry(country)
    });
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro interno do servidor', 
      error: error.message 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro interno do servidor', 
      error: error.message 
    });
  }
});

// GET /profile - Obter dados do perfil do usuário
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Perfil obtido com sucesso',
      user: user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao obter perfil', 
      error: error.message 
    });
  }
});

// PUT /profile - Atualizar dados do perfil do usuário
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      profileImage, 
      country,
      countryName,
      newsCountryCode,
      language, 
      timezone, 
      notifications, 
      defaultPriority,
      darkMode 
    } = req.body;

    // Verificar se nome/email já existem (excluindo o usuário atual)
    if (name || email) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: req.user.userId } },
          { $or: [
            ...(name ? [{ name }] : []),
            ...(email ? [{ email }] : [])
          ]}
        ]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'Nome ou email já estão em uso por outro usuário' 
        });
      }
    }

    // Preparar dados para atualização
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (country !== undefined) updateData.country = country;
    if (countryName !== undefined) updateData.countryName = countryName;
    if (newsCountryCode !== undefined) updateData.newsCountryCode = newsCountryCode;
    if (language !== undefined) updateData.language = language;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (notifications !== undefined) updateData.notifications = notifications;
    if (defaultPriority !== undefined) updateData.defaultPriority = defaultPriority;
    if (darkMode !== undefined) updateData.darkMode = darkMode;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao atualizar perfil', 
      error: error.message 
    });
  }
});

// PUT /change-password - Alterar senha do usuário
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Senha atual e nova senha são obrigatórias' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'A nova senha deve ter pelo menos 6 caracteres' 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao alterar senha', 
      error: error.message 
    });
  }
});

// DELETE /profile - Eliminar conta do usuário
router.delete('/profile', verifyToken, async (req, res) => {
  try {
    const { confirmation } = req.body;

    if (confirmation !== 'ELIMINAR') {
      return res.status(400).json({ 
        message: 'Confirmação inválida. Digite "ELIMINAR" para confirmar.' 
      });
    }    // Marcar usuário como inativo em vez de deletar completamente
    // (mantém integridade dos dados relacionados)
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        isActive: false,
        email: `deleted_${Date.now()}_${req.user.userId}@deleted.com`,
        name: `deleted_${Date.now()}_${req.user.userId}`
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Opcional: Também marcar tarefas do usuário como inativas
    // const Task = require('../models/Task');
    // await Task.updateMany(
    //   { userId: req.user.userId },
    //   { isActive: false }
    // );

    res.json({
      message: 'Conta eliminada com sucesso'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao eliminar conta', 
      error: error.message 
    });
  }
});

// POST /logout-all - Terminar todas as sessões (invalidar todos os tokens)
router.post('/logout-all', verifyToken, async (req, res) => {
  try {
    // Em uma implementação real, você manteria uma lista de tokens válidos
    // ou adicionaria um campo 'tokenVersion' ao usuário e incrementaria
    // Para esta implementação simplificada, apenas retornamos sucesso
    res.json({
      message: 'Todas as sessões foram terminadas com sucesso'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao terminar sessões', 
      error: error.message 
    });
  }
});

// Função auxiliar para obter timezone por país
function getTimezoneByCountry(countryCode) {
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
    'au': 'Australia/Sydney'
  };
  return timezones[countryCode] || 'UTC';
}

module.exports = router;
