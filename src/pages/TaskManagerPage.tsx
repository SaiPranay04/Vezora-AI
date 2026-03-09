import { Calendar, CheckCircle2, Circle, Clock, Edit2, Grip, ListTodo, Plus, Sparkles, Trash2, Tag, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  subcategory?: string;
  deadline?: string;
  created_at: string;
  last_updated: string;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
}

function SortableTaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    low: 'border-blue-500/30 bg-blue-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    high: 'border-red-500/30 bg-red-500/5',
  };

  const statusIcons = {
    pending: Circle,
    in_progress: Clock,
    completed: CheckCircle2,
  };

  const StatusIcon = statusIcons[task.status];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`group relative bg-gradient-to-br from-[#1A1A1A] to-[#151515] border rounded-xl p-4 hover:border-primary/50 transition-all ${priorityColors[task.priority]} ${task.status === 'completed' ? 'opacity-60' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <Grip size={16} className="text-text/40" />
      </div>

      {/* Priority Badge */}
      <div className="absolute top-3 right-3 flex gap-2">
        {task.priority === 'high' && (
          <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-full text-[10px] text-red-400 font-semibold uppercase">
            High
          </span>
        )}
        {task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed' && (
          <AlertCircle size={16} className="text-red-400" />
        )}
      </div>

      <div className="ml-4">
        {/* Status Icon + Title */}
        <div className="flex items-start gap-3 mb-2">
          <button
            onClick={() => {
              const nextStatus = task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'pending';
              onStatusChange(task.id, nextStatus);
            }}
            className="mt-1 transition-transform hover:scale-110"
          >
            <StatusIcon
              size={20}
              className={`${
                task.status === 'completed' ? 'text-green-400' : task.status === 'in_progress' ? 'text-yellow-400' : 'text-text/40'
              }`}
            />
          </button>
          <div className="flex-1">
            <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-text/50' : 'text-white'}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-text/60 mt-1">{task.description}</p>
            )}
          </div>
        </div>

        {/* Category Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {task.category && (
            <span className="px-2 py-1 bg-primary/10 border border-primary/20 rounded text-[10px] text-primary">
              <Tag size={10} className="inline mr-1" />
              {task.category}
            </span>
          )}
          {task.subcategory && (
            <span className="px-2 py-1 bg-secondary/10 border border-secondary/20 rounded text-[10px] text-secondary">
              {task.subcategory}
            </span>
          )}
        </div>

        {/* Footer: Deadline + Actions */}
        <div className="flex items-center justify-between text-[10px] text-text/40">
          <div className="flex items-center gap-3">
            {task.deadline && (
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {new Date(task.deadline).toLocaleDateString()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {new Date(task.last_updated).toLocaleDateString()}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(task)}
              className="p-1 rounded bg-black/50 text-text/60 hover:text-primary hover:bg-primary/20 transition-colors"
            >
              <Edit2 size={12} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(task.id)}
              className="p-1 rounded bg-black/50 text-text/60 hover:text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={12} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const TaskManagerPage = () => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | Task['status']>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAiOrganizing, setIsAiOrganizing] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    category: '',
    subcategory: '',
    deadline: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTasks();
    
    // Smart polling: Only when tab is visible, every 30 seconds
    const pollTasks = () => {
      if (document.visibilityState === 'visible' && token) {
        fetchTasks();
      }
    };
    
    const interval = setInterval(pollTasks, 30000); // 30 seconds
    
    // Also fetch when tab becomes visible
    document.addEventListener('visibilitychange', pollTasks);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', pollTasks);
    };
  }, [token]);

  const fetchTasks = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newTask,
          status: 'pending',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTasks([...tasks, data.task]);
        setNewTask({ title: '', description: '', priority: 'medium', category: '', subcategory: '', deadline: '' });
        setIsAddingTask(false);
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!token) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        setTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTasks(tasks.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const aiOrganizeTasks = async () => {
    if (!token) return;
    
    setIsAiOrganizing(true);
    try {
      const response = await fetch('http://localhost:5000/api/tasks/ai-organize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tasks }),
      });

      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to organize tasks:', error);
    } finally {
      setIsAiOrganizing(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const categoryMatch = filterCategory === 'all' || task.category === filterCategory;
    return statusMatch && categoryMatch;
  });

  const categories = ['all', ...Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)))];

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text/60">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="mb-10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
            AI Task Manager
          </h1>
          <p className="text-text/60">Organize your life with AI-powered task management.</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={aiOrganizeTasks}
            disabled={isAiOrganizing}
            className="flex items-center gap-2 bg-secondary/20 hover:bg-secondary/30 text-secondary px-4 py-2 rounded-xl transition-colors border border-secondary/30 disabled:opacity-50"
          >
            <Sparkles size={18} className={isAiOrganizing ? 'animate-spin' : ''} />
            {isAiOrganizing ? 'Organizing...' : 'AI Organize'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={18} />
            Add Task
          </motion.button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="flex gap-2">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === status
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-text/60 hover:bg-white/10'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-primary transition-colors"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', count: tasks.length, color: 'primary', icon: ListTodo },
          { label: 'Pending', count: tasks.filter((t) => t.status === 'pending').length, color: 'blue', icon: Circle },
          { label: 'In Progress', count: tasks.filter((t) => t.status === 'in_progress').length, color: 'yellow', icon: Clock },
          { label: 'Completed', count: tasks.filter((t) => t.status === 'completed').length, color: 'green', icon: CheckCircle2 },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/5 rounded-xl p-6"
          >
            <stat.icon size={24} className={`text-${stat.color}-400 mb-2`} />
            <div className="text-2xl font-bold mb-1">{stat.count}</div>
            <div className="text-xs text-text/50">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Task List with Drag & Drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            <AnimatePresence>
              {filteredTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 text-text/50"
                >
                  <ListTodo size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No tasks found. Add one or say "add task" in voice chat!</p>
                </motion.div>
              ) : (
                filteredTasks.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    onEdit={setEditingTask}
                    onDelete={deleteTask}
                    onStatusChange={updateTask}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingTask(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/10 rounded-2xl p-8 max-w-2xl w-full"
            >
              <h2 className="text-2xl font-bold mb-6">Edit Task</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task title *"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors resize-none"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })}
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as Task['status'] })}
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Category (e.g., Work, Personal)"
                    value={editingTask.category || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                  />
                  <input
                    type="date"
                    value={editingTask.deadline ? editingTask.deadline.split('T')[0] : ''}
                    onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingTask(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateTask(editingTask.id, {
                    title: editingTask.title,
                    description: editingTask.description,
                    priority: editingTask.priority,
                    status: editingTask.status,
                    category: editingTask.category,
                    deadline: editingTask.deadline,
                  })}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-xl transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isAddingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsAddingTask(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/10 rounded-2xl p-8 max-w-2xl w-full"
            >
              <h2 className="text-2xl font-bold mb-6">Add New Task</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task title *"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors resize-none"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Category (e.g., Work, Personal)"
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Subcategory (optional)"
                    value={newTask.subcategory}
                    onChange={(e) => setNewTask({ ...newTask, subcategory: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-xl transition-colors"
                >
                  Add Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
