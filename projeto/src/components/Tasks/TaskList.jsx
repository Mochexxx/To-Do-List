import React, { useState, useEffect } from 'react';

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await tasksService.getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
      try {
        await tasksService.deleteTask(taskId);
        setTasks(tasks.filter(task => task._id !== taskId));
      } catch (error) {
        alert('Erro ao deletar tarefa');
      }
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const updatedTask = await tasksService.updateTask(task._id, {
        completed: !task.completed
      });
      setTasks(tasks.map(t => t._id === task._id ? updatedTask : t));
    } catch (error) {
      alert('Erro ao atualizar tarefa');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'pending' && !task.completed) || 
      (filter === 'completed' && task.completed);
    
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return <div>Carregando tarefas...</div>;
  }

  return (
    <div>
      {/* Header with filters and add button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '0.5rem' }}
          >
            <option value="all">Todas</option>
            <option value="pending">Pendentes</option>
            <option value="completed">Concluídas</option>
          </select>
          
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem', minWidth: '200px' }}
          />
        </div>
        
        <button 
          onClick={() => { setShowForm(true); setEditingTask(null); }}
          style={{ 
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          + Nova Tarefa
        </button>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm 
          task={editingTask}
          onSave={(newTask) => {
            if (editingTask) {
              setTasks(tasks.map(t => t._id === newTask._id ? newTask : t));
            } else {
              setTasks([newTask, ...tasks]);
            }
            setShowForm(false);
            setEditingTask(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Tasks List */}
      <div>
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            {tasks.length === 0 ? 'Nenhuma tarefa encontrada. Crie sua primeira tarefa!' : 'Nenhuma tarefa corresponde aos filtros.'}
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskItem 
              key={task._id}
              task={task}
              onEdit={(task) => {
                setEditingTask(task);
                setShowForm(true);
              }}
              onDelete={handleDeleteTask}
              onToggleComplete={handleToggleComplete}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default TaskList;
