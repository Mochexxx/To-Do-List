import React from 'react';

function TaskItem({ task, onEdit, onDelete, onToggleComplete }) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta': return '#dc3545';
      case 'média': return '#ffc107';
      case 'baixa': return '#28a745';
      default: return '#6c757d';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '0.5rem',
      backgroundColor: task.completed ? '#f8f9fa' : 'white',
      opacity: task.completed ? 0.7 : 1,
      borderLeft: `4px solid ${getPriorityColor(task.priority)}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleComplete(task)}
              style={{ marginRight: '0.5rem' }}
            />
            <h4 style={{ 
              margin: 0,
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? '#6c757d' : 'inherit'
            }}>
              {task.title}
            </h4>
            <span style={{
              marginLeft: '0.5rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              backgroundColor: getPriorityColor(task.priority),
              color: 'white'
            }}>
              {task.priority}
            </span>
            {isOverdue && (
              <span style={{
                marginLeft: '0.5rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                backgroundColor: '#dc3545',
                color: 'white'
              }}>
                Atrasada
              </span>
            )}
          </div>
          
          {task.description && (
            <p style={{ 
              margin: '0.5rem 0',
              color: task.completed ? '#6c757d' : '#495057'
            }}>
              {task.description}
            </p>
          )}
          
          {task.dueDate && (
            <small style={{ 
              color: isOverdue ? '#dc3545' : '#6c757d'
            }}>
              📅 {formatDate(task.dueDate)}
            </small>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onEdit(task)}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem'
            }}
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => onDelete(task._id)}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem'
            }}
          >
            🗑️ Deletar
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskItem;
