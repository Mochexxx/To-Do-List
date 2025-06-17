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
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        startDate: startDate || null,
        dueDate: dueDate || null,
        priority,
        status,
        isRecurring,
        recurringType: isRecurring ? recurringType : undefined,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null
      };

      let savedTask;
      if (isEditing) {
        savedTask = await tasksService.updateTask(task._id, taskData);
      } else {
        savedTask = await tasksService.createTask(taskData);
      }

      onSave(savedTask);
    } catch (error) {
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

  // Rest of the component JSX would be similar to the HTML version
  // but with proper React JSX syntax
  
  return (
    <div>
      {/* Full component implementation would go here */}
      <p>Enhanced TaskForm with all new fields - see HTML version for full implementation</p>
    </div>
  );
}

export default TaskForm;
