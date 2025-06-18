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
  // Separar tarefas em completadas e não completadas
  const completedTasks = tasks.filter(task => task.completed && task.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const pendingTasks = tasks.filter(task => !task.completed && task.title.toLowerCase().includes(searchTerm.toLowerCase()));

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
          <button 
            onClick={() => setFilter('all')}
            style={{ 
              padding: '0.75rem 1.5rem',
              backgroundColor: filter === 'all' ? '#4CAF50' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
          >
            Todas ({tasks.length})
          </button>
          
          <button 
            onClick={() => setFilter('pending')}
            style={{ 
              padding: '0.75rem 1.5rem',
              backgroundColor: filter === 'pending' ? '#4CAF50' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
          >
            Pendentes ({pendingTasks.length})
          </button>

          <button 
            onClick={() => setFilter('completed')}
            style={{ 
              padding: '0.75rem 1.5rem',
              backgroundColor: filter === 'completed' ? '#4CAF50' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
          >
            Completas ({completedTasks.length})
          </button>
          
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ 
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #ced4da',
              minWidth: '200px',
              fontSize: '1rem'
            }}
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
              alert('Tarefa atualizada com sucesso!');
            } else {
              setTasks([newTask, ...tasks]);
              alert('Tarefa criada com sucesso!');
            }
            setShowForm(false);
            setEditingTask(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}      {/* Tasks List */}
      <div>
        {/* Mostra mensagem se não houver tarefas */}
        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Nenhuma tarefa encontrada. Crie sua primeira tarefa!
          </div>
        )}

        {/* Mostra tarefas baseado no filtro selecionado */}
        {tasks.length > 0 && (
          <>
            {/* Tarefas Pendentes */}
            {(filter === 'all' || filter === 'pending') && pendingTasks.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: '#2E7D32',
                  borderBottom: '2px solid #2E7D32',
                  paddingBottom: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  Tarefas Pendentes
                </h2>
                {pendingTasks.map(task => (
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
                ))}
              </div>
            )}

            {/* Tarefas Completadas */}
            {(filter === 'all' || filter === 'completed') && completedTasks.length > 0 && (
              <div>
                <h2 style={{ 
                  color: '#2E7D32',
                  borderBottom: '2px solid #2E7D32',
                  paddingBottom: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  Tarefas Completadas
                </h2>
                {completedTasks.map(task => (
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
                ))}
              </div>
            )}

            {/* Mensagem quando nenhuma tarefa corresponde aos filtros */}
            {(filter === 'pending' && pendingTasks.length === 0) || 
             (filter === 'completed' && completedTasks.length === 0) || 
             (searchTerm && pendingTasks.length === 0 && completedTasks.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                Nenhuma tarefa corresponde aos filtros.
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default TaskList;
