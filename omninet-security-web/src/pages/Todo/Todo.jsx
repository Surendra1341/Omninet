import { useState, useEffect } from 'react';
import { todoAPI } from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

function Todo() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlyCreatedTodos, setNewlyCreatedTodos] = useState(new Set());
  const [deletingTodos, setDeletingTodos] = useState(new Set());

  const [createTodo, setCreateTodo] = useState({
    title: '',
    status: {
      id: 2,
      name: 'In progess'
    }
  });

  const [editTodo, setEditTodo] = useState({
    id: null,
    title: '',
    status: {
      id: 2,
      name: 'In progess'
    }
  });

  const statusOptions = [
    { id: 1, name: 'Not Started' },
    { id: 2, name: 'In progess' },
    { id: 3, name: 'Complted' }
  ];

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await todoAPI.getTodos();
      if (response.status === 'success' || response.success) {
        setTodos(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);

      console.error('Full error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
      
      // Handle specific server errors
      if (error.response?.status === 500) {
        toast.error('Server error. Please contact administrator.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to fetch todos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    if (!createTodo.title.trim()) {
      toast.error('Please enter a todo title');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await todoAPI.createTodo({
        title: createTodo.title.trim(),
        status: { id: 2, name: 'In progess' }
      });

      if (response.status === 'success' || response.success) {
        toast.success('Todo created successfully!');
        setIsCreateModalOpen(false);
        setCreateTodo({ title: '', status: { id: 2, name: 'In progess' } });
        
        // Add new todo with fade-in animation - check if response has data and id
        const newTodo = response.data;
        if (newTodo && newTodo.id) {
          setTodos(prevTodos => [...prevTodos, newTodo]);
          setNewlyCreatedTodos(prev => new Set([...prev, newTodo.id]));
          
          // Remove fade-in class after animation completes
          setTimeout(() => {
            setNewlyCreatedTodos(prev => {
              const newSet = new Set(prev);
              newSet.delete(newTodo.id);
              return newSet;
            });
          }, 500);
        } else {
          // Fallback: refresh the entire list if no proper response
          fetchTodos();
        }
      }
    } catch (error) {
      console.error('Error creating todo:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to create todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTodo = async (e) => {
    e.preventDefault();
    if (!editTodo.title.trim()) {
      toast.error('Please enter a todo title');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await todoAPI.updateTodo({
        id: editTodo.id,
        title: editTodo.title.trim(),
        status: editTodo.status
      });

      if (response.status === 'success' || response.success) {
        toast.success('Todo updated successfully!');
        setIsEditModalOpen(false);
        fetchTodos();
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to update todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTodo = async (id) => {
    // Add fade-out animation immediately
    setDeletingTodos(prev => new Set([...prev, id]));

    try {
      // Wait for fade-out animation to start
      setTimeout(async () => {
        try {
          const response = await todoAPI.deleteTodo(id);
          if (response.status === 'success') {
            // Remove from state after fade-out completes
            setTimeout(() => {
              setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
              setDeletingTodos(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
              });
            }, 300);
            toast.success('Todo deleted successfully!');
          } else {
            throw new Error('Delete operation failed');
          }
        } catch (error) {
          console.error('Error deleting todo:', error);
          
          // Remove fade-out state if error occurs
          setDeletingTodos(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
          
          // Handle specific error cases
          if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || error.message;
            
            switch (status) {
              case 404:
                toast.error('Todo not found. It may have been already deleted.');
                // Remove from local state since it doesn't exist on server
                setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
                break;
              case 403:
                toast.error('You do not have permission to delete this todo.');
                break;
              case 500:
                toast.error('Server error occurred while deleting todo.');
                break;
              default:
                toast.error(`Failed to delete todo: ${message}`);
            }
          } else if (error.request) {
            toast.error('Network error. Please check your connection and try again.');
          } else {
            toast.error('An unexpected error occurred while deleting todo.');
          }
          
          // Refresh the list to sync with server state
          fetchTodos();
        }
      }, 100);
    } catch (error) {
      // Remove fade-out state if immediate error
      setDeletingTodos(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const openEditModal = (todo) => {
    setEditTodo({
      id: todo.id,
      title: todo.title,
      status: todo.status
    });
    setIsEditModalOpen(true);
  };

  const handleToggleStatus = async (todo) => {
    const newStatus = todo.status.id === 2 
      ? { id: 3, name: 'Complted' }
      : { id: 2, name: 'In progess' };

    try {
      const response = await todoAPI.updateTodo({
        id: todo.id,
        title: todo.title,
        status: newStatus
      });

      if (response.status === 'success' || response.success) {
        toast.success('Todo status updated successfully!');
        fetchTodos();
      }
    } catch (error) {
      console.error('Error updating todo status:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to update todo status');
    }
  };

  const getStatusColor = (statusId) => {
    switch (statusId) {
      case 1: return 'bg-gray-100 text-gray-800 border-gray-300';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 3: return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative min-h-screen dark:bg-stone-400 p-4">
      {/* Toast Container */}
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
              color: '#fff',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
              color: '#fff',
            },
          },
        }}
      />

      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Todos</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="cursor-pointer bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <AddIcon className="w-5 h-5" />
            Add Todo
          </button>
        </div>

        {/* Todo Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg">
              No todos found. Create your first todo!
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todos.map((todo) => {
              const isNewlyCreated = newlyCreatedTodos.has(todo.id);
              const isDeleting = deletingTodos.has(todo.id);
              
              return (
                <div
                  key={todo.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-500 ease-in-out hover:shadow-lg hover:scale-103 group ${
                    isNewlyCreated 
                      ? 'opacity-0 animate-fade-in' 
                      : isDeleting 
                      ? 'opacity-100 animate-fade-out' 
                      : 'opacity-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 mr-2">
                      {todo.title}
                    </h3>
                    <div className="flex gap-2  transition-opacity duration-200">
                      <button
                        onClick={() => openEditModal(todo)}
                        className="cursor-pointer p-1 text-blue-800 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        disabled={isDeleting}
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="cursor-pointer p-1 text-red-700 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                        disabled={isDeleting}
                      >
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(todo.status.id)}`}>
                        {todo.status.name}
                      </span>
                      
                      {/* Toggle Switch for In Progress / Completed */}
                      {(todo.status.id === 2 || todo.status.id === 3) && (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={todo.status.id === 3}
                            onChange={() => handleToggleStatus(todo)}
                            disabled={isDeleting}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                            {todo.status.id === 3 ? 'Completed' : 'Complete'}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div>Created: {formatDate(todo.createdDate)}</div>
                      <div>Updated: {formatDate(todo.updatedDate)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Todo Modal */}
        <div className={`fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4 transition-all duration-300 ease-in-out ${
            isCreateModalOpen 
                ? 'opacity-100 pointer-events-auto' 
                : 'opacity-0 pointer-events-none'
        }`}>
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transition-all duration-300 ease-in-out ${
                isCreateModalOpen 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-0 scale-95 translate-y-4'
            }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Todo</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleCreateTodo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={createTodo.title}
                    onChange={(e) => setCreateTodo(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter todo title"
                    required
                  />
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Status will be set to "In progess" by default</p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Todo'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

      {/* Edit Todo Modal */}
        <div className={`fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4 transition-all duration-300 ease-in-out ${
            isEditModalOpen 
                ? 'opacity-100 pointer-events-auto' 
                : 'opacity-0 pointer-events-none'
        }`}>
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transition-all duration-300 ease-in-out ${
                isEditModalOpen 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-0 scale-95 translate-y-4'
            }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Todo</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleEditTodo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTodo.title}
                    onChange={(e) => setEditTodo(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter todo title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editTodo.status.id}
                    onChange={(e) => {
                      const selectedStatus = statusOptions.find(s => s.id === parseInt(e.target.value));
                      setEditTodo(prev => ({ ...prev, status: selectedStatus }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Update Todo'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

      {/* CSS animations using regular style tag */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
        
        .animate-fade-out {
          animation: fadeOut 0.3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

export default Todo;