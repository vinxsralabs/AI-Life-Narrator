import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Plus, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Square,
  ArrowRight,
  Zap,
  Target,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import ConfirmationModal from './ui/ConfirmationModal';
import { Link } from 'react-router-dom';

interface Todo {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

interface TodayTodos {
  today_todos: Todo[];
  overdue_todos: Todo[];
  total_count: number;
  recent_todos?: Todo[];
}

const TodoWidget: React.FC = () => {
  const [todayTodos, setTodayTodos] = useState<TodayTodos | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    todoId: null as number | null,
    todoTitle: ''
  });

  const priorityColors = {
    low: 'text-blue-500',
    medium: 'text-yellow-500',
    high: 'text-red-500'
  };

  useEffect(() => {
    fetchTodayTodos();
  }, []);

  const fetchTodayTodos = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching todos...');
      console.log('Axios auth header:', axios.defaults.headers.common['Authorization']);
      
      // Simplified: Just fetch recent active todos
      const response = await axios.get('/api/todos?status_filter=active&sort_by=created_at&sort_order=desc&limit=10');
      console.log('Todos response:', response.data);
      
      setTodayTodos({
        today_todos: [],
        overdue_todos: [],
        total_count: response.data.todos.length,
        recent_todos: response.data.todos
      });
    } catch (error: any) {
      console.error('Error fetching todos:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setIsCreating(true);
    try {
      await axios.post('/api/todos', {
        title: quickTitle.trim(),
        description: '',
        due_date: null,
        priority: 'medium',
        status: 'active'
      });
      
      toast.success('Todo added! 🎉');
      setQuickTitle('');
      setShowQuickAdd(false);
      fetchTodayTodos();
    } catch (error: any) {
      console.error('Error creating todo:', error);
      toast.error('Failed to create todo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (todoId: number, newStatus: string) => {
    try {
      await axios.patch(`/api/todos/${todoId}/status`, { status: newStatus });
      toast.success(`Todo ${newStatus}! ✨`);
      fetchTodayTodos();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteClick = (todoId: number, todoTitle: string) => {
    setDeleteModal({
      isOpen: true,
      todoId,
      todoTitle
    });
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      todoId: null,
      todoTitle: ''
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.todoId) return;

    try {
      await axios.delete(`/api/todos/${deleteModal.todoId}`);
      toast.success('Todo deleted! 🗑️');
      handleDeleteCancel();
      fetchTodayTodos();
    } catch (error: any) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete todo');
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const isOverdue = (todo: Todo) => {
    if (!todo.due_date || todo.status !== 'active') return false;
    return new Date(todo.due_date) < new Date();
  };

  const allTodos = [
    ...(todayTodos?.overdue_todos || []),
    ...(todayTodos?.today_todos || []),
    ...(todayTodos?.recent_todos || [])
  ].slice(0, 5); // Show max 5 todos

  const showingRecent = todayTodos?.recent_todos && todayTodos.recent_todos.length > 0;
  
  // Debug logging
  console.log('TodoWidget - todayTodos:', todayTodos);
  console.log('TodoWidget - allTodos:', allTodos);
  console.log('TodoWidget - showingRecent:', showingRecent);

  if (isLoading) {
    return (
      <Card className="h-80">
        <CardContent className="p-6 flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-night-accent"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-80 flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="text-indigo-500" size={20} />
            <span>My Tasks</span>
            {todayTodos && todayTodos.total_count > 0 && (
              <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full">
                {todayTodos.total_count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="text-indigo-500 hover:text-indigo-600"
              title="Add new task"
            >
              <Plus size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTodayTodos}
              className="text-blue-500 hover:text-blue-600"
              title="Refresh tasks"
            >
              <ArrowRight size={16} />
            </Button>
            <Link to="/todos">
              <Button variant="ghost" size="sm" className="text-night-text-secondary hover:text-night-text">
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        {/* Quick Add Form */}
        <AnimatePresence>
          {showQuickAdd && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleQuickAdd}
              className="mb-4 overflow-hidden"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Add a quick task..."
                  className="flex-1 px-3 py-2 text-sm bg-night-surface border border-night-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  loading={isCreating}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <Plus size={14} />
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Todo List */}
        <div className="flex-1 overflow-y-auto">
          {allTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Target className="text-night-text-secondary mb-2" size={32} />
              <p className="text-sm text-night-text-secondary mb-2">No tasks yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickAdd(true)}
                className="text-indigo-500 hover:text-indigo-600"
              >
                <Plus size={14} className="mr-1" />
                Add your first task
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {allTodos.map((todo, index) => {
                const overdue = isOverdue(todo);
                
                return (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
                      overdue 
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' 
                        : 'bg-night-card border-night-border hover:border-night-accent'
                    } ${todo.status === 'completed' ? 'opacity-60' : ''}`}
                  >
                    {/* Status Toggle */}
                    <button
                      onClick={() => handleStatusChange(
                        todo.id, 
                        todo.status === 'completed' ? 'active' : 'completed'
                      )}
                      className={`mt-0.5 transition-colors ${
                        todo.status === 'completed' 
                          ? 'text-green-500 hover:text-green-600' 
                          : 'text-night-text-secondary hover:text-green-500'
                      }`}
                    >
                      {todo.status === 'completed' ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium text-night-text leading-tight ${
                        todo.status === 'completed' ? 'line-through' : ''
                      }`}>
                        {todo.title}
                      </h4>
                      
                      <div className="flex items-center gap-3 mt-1">
                        {/* Priority */}
                        <div className={`text-xs ${priorityColors[todo.priority]}`}>
                          ● {todo.priority}
                        </div>

                        {/* Time */}
                        {todo.due_date && (
                          <div className={`flex items-center gap-1 text-xs ${
                            overdue ? 'text-red-500' : 'text-night-text-secondary'
                          }`}>
                            <Clock size={10} />
                            {formatTime(todo.due_date)}
                            {overdue && <AlertCircle size={10} />}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteClick(todo.id, todo.title)}
                      className="opacity-70 hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 p-1 ml-2"
                      title="Delete todo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                );
              })}

              {/* Show more indicator */}
              {todayTodos && todayTodos.total_count > 5 && (
                <Link to="/todos">
                  <div className="flex items-center justify-center gap-2 p-2 text-sm text-night-text-secondary hover:text-indigo-500 transition-colors">
                    <span>+{todayTodos.total_count - 5} more tasks</span>
                    <ArrowRight size={14} />
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Todo"
        message={`Are you sure you want to delete "${deleteModal.todoTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </Card>
  );
};

export default TodoWidget;