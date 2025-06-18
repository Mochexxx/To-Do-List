import React, { useState, useEffect } from 'react';

function TaskForm({ task, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('média');
  const [status, setStatus] = useState('pendente');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState('semanal');
  const [tags, setTags] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setPriority(task.priority || 'média');
      setStatus(task.status || 'pendente');
      setIsRecurring(task.isRecurring || false);
      setRecurringType(task.recurringType || 'semanal');
      setTags(task.tags ? task.tags.join(', ') : '');
      setEstimatedDuration(task.estimatedDuration || '');
    }
  }, [task]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    
    if (title.length > 100) {
      newErrors.title = 'Título deve ter no máximo 100 caracteres';
    }
    
    if (description.length > 1000) {
      newErrors.description = 'Descrição deve ter no máximo 1000 caracteres';
    }

    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      newErrors.dueDate = 'Data de fim deve ser posterior à data de início';
    }

    if (estimatedDuration && (estimatedDuration < 1 || estimatedDuration > 10080)) {
      newErrors.estimatedDuration = 'Duração deve estar entre 1 minuto e 1 semana';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== INICIANDO CRIAÇÃO DE TAREFA ===');
    console.log('Estado do formulário:', {
      title,
      description,
      priority,
      status,
      isRecurring,
      estimatedDuration,
      tags
    });
    
    if (!validateForm()) {
      console.log('❌ Formulário inválido');
      return;
    }

    setLoading(true);
    try {      const taskData = {
        title: title.trim(),
        description: description.trim(),
        startDate: startDate || null,
        dueDate: dueDate || null,
        priority,
        status,
        isRecurring,
        recurringType: isRecurring ? recurringType : undefined,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };

      // Só adicionar estimatedDuration se tiver valor válido
      if (estimatedDuration && estimatedDuration.trim() !== '') {
        taskData.estimatedDuration = estimatedDuration;
      }

      console.log('📝 Dados da tarefa a enviar:', taskData);
      console.log('🔐 Token atual:', localStorage.getItem('token') ? 'Token existe' : 'Sem token');
      console.log('👤 Usuário atual:', authService.getUser());

      let savedTask;
      if (isEditing) {
        console.log('✏️ Atualizando tarefa:', task._id);
        savedTask = await tasksService.updateTask(task._id, taskData);
      } else {
        console.log('➕ Criando nova tarefa...');
        savedTask = await tasksService.createTask(taskData);
      }

      console.log('✅ Tarefa salva com sucesso:', savedTask);
      onSave(savedTask);
    } catch (error) {
      console.error('❌ ERRO ao criar/atualizar tarefa:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label>Título:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          required
        />
        {errors.title && <p style={{ color: 'red' }}>{errors.title}</p>}
      </div>

      <div>
        <label>Descrição:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
        />
        {errors.description && <p style={{ color: 'red' }}>{errors.description}</p>}
      </div>

      <div>
        <label>Data de Início:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div>
        <label>Data de Fim:</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        {errors.dueDate && <p style={{ color: 'red' }}>{errors.dueDate}</p>}
      </div>

      <div>
        <label>Prioridade:</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="baixa">Baixa</option>
          <option value="média">Média</option>
          <option value="alta">Alta</option>
        </select>
      </div>

      <div>
        <label>Estado:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pendente">Pendente</option>
          <option value="em_progresso">Em Progresso</option>
          <option value="concluída">Concluída</option>
        </select>
      </div>

      <div>
        <label>Recorrente:</label>
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
        />
        {isRecurring && (
          <select value={recurringType} onChange={(e) => setRecurringType(e.target.value)}>
            <option value="diária">Diária</option>
            <option value="semanal">Semanal</option>
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
          </select>
        )}
      </div>

      <div>
        <label>Etiquetas (tags):</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Ex: trabalho, pessoal, urgente"
        />
      </div>      <div>
        <label>Duração Estimada:</label>
        <select value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)}>
          <option value="">Não especificado</option>
          <option value="15min">15 minutos</option>
          <option value="30min">30 minutos</option>
          <option value="1h">1 hora</option>
          <option value="2h">2 horas</option>
          <option value="4h">4 horas</option>
          <option value="8h">8 horas</option>
          <option value="1d+">1 dia ou mais</option>
        </select>
        {errors.estimatedDuration && <p style={{ color: 'red' }}>{errors.estimatedDuration}</p>}
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button type="submit" disabled={loading}>{isEditing ? 'Atualizar' : 'Criar'}</button>
        <button type="button" onClick={onCancel}>Cancelar</button>
      </div>

      {errors.submit && <p style={{ color: 'red' }}>{errors.submit}</p>}
    </form>
  );
}

export default TaskForm;
