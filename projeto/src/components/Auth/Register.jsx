import React, { useState } from 'react';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState(generateCaptcha());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Access authService from global window object
  const authService = window.authService;

  function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { question: `${num1} + ${num2}`, answer: num1 + num2 };
  }

  const validateForm = () => {
    const newErrors = {};

    if (!username.trim()) newErrors.username = 'Username é obrigatório';
    if (!email.trim()) newErrors.email = 'Email é obrigatório';
    if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';
    if (!password) newErrors.password = 'Password é obrigatória';
    if (password.length < 6) newErrors.password = 'Password deve ter pelo menos 6 caracteres';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords não coincidem';
    if (parseInt(captcha) !== captchaAnswer.answer) newErrors.captcha = 'Captcha incorreto';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Enviar dados para o servidor usando authService
      const response = await authService.register({
        name: username, // O backend espera 'name', não 'username'
        email: email,
        password: password
      });

      // Se chegou aqui, o registro foi bem-sucedido
      alert('Registro realizado com sucesso!');
      // Redirecionar para a página principal ou login
      window.location.href = '/';
      
    } catch (error) {
      console.error('Erro no registro:', error);
      setErrors({ submit: error.message || 'Erro interno do servidor' });
    } finally {
      setLoading(false);
    }
  };

  const refreshCaptcha = () => {
    setCaptchaAnswer(generateCaptcha());
    setCaptcha('');
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <button onClick={() => window.history.back()} style={{ marginBottom: '1rem' }}>
        Back
      </button>
      <h2>Registro</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
          {errors.username && <small style={{ color: 'red' }}>{errors.username}</small>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
          {errors.email && <small style={{ color: 'red' }}>{errors.email}</small>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
          {errors.password && <small style={{ color: 'red' }}>{errors.password}</small>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="confirmPassword">Confirmar Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
          {errors.confirmPassword && <small style={{ color: 'red' }}>{errors.confirmPassword}</small>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Captcha: {captchaAnswer.question} = ?</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="number"
              value={captcha}
              onChange={e => setCaptcha(e.target.value)}
              style={{ padding: '0.5rem', flex: 1 }}
              placeholder="Resposta"
            />
            <button type="button" onClick={refreshCaptcha}>🔄</button>
          </div>
          {errors.captcha && <small style={{ color: 'red' }}>{errors.captcha}</small>}
        </div>        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '0.5rem 1rem', 
            width: '100%',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Registrando...' : 'Registrar'}
        </button>

        {errors.submit && (
          <div style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>
            {errors.submit}
          </div>
        )}
      </form>
    </div>
  );
}

export default RegisterPage;
