import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Plus, 
  Calendar,
  Clock,
  AlertCircle,
  Filter,
  SortAsc,
  SortDesc,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  Target,
  Flag,
  CheckCircle,
  Square,
  ChevronDown,
  Search,
  Zap,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import ConfirmationModal from '../components/ui/ConfirmationModal';

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

interface TodoStats {
  total_todos: number;
  completed_todos: number;
  active_todos: number;
  overdue_todos: number;
  completion_rate: number;
  productivity_trend: string;
}

interface TodoFormData {
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'archived';
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<TodoFormData>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'active'
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    todoId: null as number | null,
    todoTitle: ''
  });

  const priorityColors = {
    low: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
    medium: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
    high: 'text-red-500 bg-red-100 dark:bg-red-900/30'
  };

  const priorityIcons = {
    low: Flag,
    medium: Flag,
    high: AlertCircle
  };

  const statusColors = {
    active: 'text-green-500',
    completed: 'text-gray-500',
    archived: 'text-purple-500'
  };

  useEffect(() => {
    fetchTodos();
    fetchStats();
  }, [statusFilter, priorityFilter, sortBy, sortOrder]);

  const fetchTodos = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status_filter', statusFilter);
      if (priorityFilter) params.append('priority_filter', priorityFilter);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      params.append('limit', '100');

      const response = await axios.get(`/api/todos?${params.toString()}`);
      setTodos(response.data.todos);
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast.error('Failed to load todos');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/todos/stats/summary');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      status: 'active'
    });
    setEditingTodo(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const todoData = {
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
      };

      if (editingTodo) {
        await axios.put(`/api/todos/${editingTodo.id}`, todoData);
        toast.success('Todo updated successfully! 🎉');
      } else {
        await axios.post('/api/todos', todoData);
        toast.success('Todo created successfully! 🎉');
      }

      resetForm();
      fetchTodos();
      fetchStats();
    } catch (error) {
      console.error('Error saving todo:', error);
      toast.error('Failed to save todo');
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      due_date: todo.due_date ? new Date(todo.due_date).toISOString().split('T')[0] : '',
      priority: todo.priority,
      status: todo.status
    });
    setShowCreateForm(true);
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
      fetchTodos();
      fetchStats();
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete todo');
    }
  };

  const handleStatusChange = async (todoId: number, newStatus: string) => {
    try {
      await axios.patch(`/api/todos/${todoId}/status`, { status: newStatus });
      toast.success(`Todo ${newStatus}! ✨`);
      fetchTodos();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const isOverdue = (todo: Todo) => {
    if (!todo.due_date || todo.status !== 'active') return false;
    return new Date(todo.due_date) < new Date();
  };

  const filteredTodos = todos.filter(todo => {
    if (searchTerm && !todo.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !todo.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': 
        return <TrendingUp className="text-green-500" size={16} />;
      case 'declining': 
        return <TrendingUp className="text-red-500 rotate-180" size={16} />;
      default: 
        return <Target className="text-yellow-500" size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-night-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-4">
          <CheckSquare className="mr-3 text-indigo-500" size={32} />
          <h1 className="text-4xl font-bold text-night-text">Todo List</h1>
        </div>
        <p className="text-lg text-night-text-secondary">
          Organize your tasks and boost your productivity
        </p>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="overflow-hidden">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="text-green-500" size={24} />
              </div>
              <div className="text-2xl font-bold text-night-text">{stats.completed_todos}</div>
              <div className="text-sm text-night-text-secondary">Completed</div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Square className="text-blue-500" size={24} />
              </div>
              <div className="text-2xl font-bold text-night-text">{stats.active_todos}</div>
              <div className="text-sm text-night-text-secondary">Active</div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="text-red-500" size={24} />
              </div>
              <div className="text-2xl font-bold text-night-text">{stats.overdue_todos}</div>
              <div className="text-sm text-night-text-secondary">Overdue</div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {getTrendIcon(stats.productivity_trend)}
              </div>
              <div className="text-2xl font-bold text-night-text">{stats.completion_rate.toFixed(0)}%</div>
              <div className="text-sm text-night-text-secondary">Completion Rate</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-night-text-secondary" size={16} />
          <input
            type="text"
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-night-surface border border-night-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-night-surface border border-night-border rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-night-surface border border-night-border rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <Button
            onClick={() => {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            Sort
          </Button>

          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2"
          >
            <Plus size={16} />
            Add Todo
          </Button>
        </div>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="text-indigo-500" size={20} />
                  {editingTodo ? 'Edit Todo' : 'Create New Todo'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-night-text mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter todo title..."
                      className="w-full p-3 bg-night-surface border border-night-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-night-text mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Add details about this todo..."
                      className="w-full p-3 bg-night-surface border border-night-border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-night-text mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-full p-3 bg-night-surface border border-night-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-night-text mb-2">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full p-3 bg-night-surface border border-night-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-night-text mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full p-3 bg-night-surface border border-night-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="bg-indigo-500 hover:bg-indigo-600 text-white"
                    >
                      {editingTodo ? 'Update Todo' : 'Create Todo'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Todo List */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="mx-auto text-night-text-secondary mb-4" size={48} />
              <h3 className="text-lg font-medium text-night-text mb-2">No todos found</h3>
              <p className="text-night-text-secondary">
                {searchTerm ? 'Try adjusting your search or filters' : 'Create your first todo to get started!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTodos.map((todo, index) => {
            const PriorityIcon = priorityIcons[todo.priority];
            const overdue = isOverdue(todo);
            
            return (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`transition-all duration-200 hover:shadow-lg ${
                  overdue ? 'border-red-300 bg-red-50/50 dark:bg-red-900/10' : ''
                } ${todo.status === 'completed' ? 'opacity-70' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Status Toggle */}
                      <button
                        onClick={() => handleStatusChange(
                          todo.id, 
                          todo.status === 'completed' ? 'active' : 'completed'
                        )}
                        className={`mt-1 p-1 rounded-full transition-colors ${
                          todo.status === 'completed' 
                            ? 'text-green-500 hover:text-green-600' 
                            : 'text-night-text-secondary hover:text-green-500'
                        }`}
                      >
                        {todo.status === 'completed' ? (
                          <CheckCircle size={20} />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className={`font-medium text-night-text ${
                              todo.status === 'completed' ? 'line-through' : ''
                            }`}>
                              {todo.title}
                            </h3>
                            {todo.description && (
                              <p className="text-sm text-night-text-secondary mt-1">
                                {todo.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 mt-3">
                              {/* Priority */}
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priorityColors[todo.priority]}`}>
                                <PriorityIcon size={12} />
                                {todo.priority}
                              </div>

                              {/* Due Date */}
                              {todo.due_date && (
                                <div className={`flex items-center gap-1 text-xs ${
                                  overdue ? 'text-red-500' : 'text-night-text-secondary'
                                }`}>
                                  <Calendar size={12} />
                                  {formatDate(todo.due_date)}
                                  {overdue && <AlertCircle size={12} />}
                                </div>
                              )}

                              {/* Status Badge */}
                              <div className={`text-xs ${statusColors[todo.status]}`}>
                                ● {todo.status}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(todo)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit size={14} />
                            </Button>
                            
                            {todo.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(todo.id, 'archived')}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Archive size={14} />
                              </Button>
                            )}

                            {todo.status === 'archived' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(todo.id, 'active')}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <RotateCcw size={14} />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(todo.id, todo.title)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
      
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
    </div>
  );
};

export default TodoList;