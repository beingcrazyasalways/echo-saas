'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSession } from '../../lib/supabaseClient';
import { fetchTasks, addTask, toggleTask, deleteTask, updateTaskPriority } from '../../lib/tasks';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import TaskList from '../../components/TaskList';
import { Plus, Filter } from 'lucide-react';

export default function TasksPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedEmotion = localStorage.getItem('currentEmotion');
    if (savedEmotion) {
      setCurrentEmotion(savedEmotion);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [tasks, filter]);

  const checkAuth = async () => {
    const { session } = await getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    const { user: currentUser } = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const loadTasks = async () => {
    if (!user) return;
    const { data } = await fetchTasks(user.id);
    setTasks(data || []);
  };

  const applyFilter = () => {
    switch (filter) {
      case 'active':
        setFilteredTasks(tasks.filter((task) => !task.completed));
        break;
      case 'completed':
        setFilteredTasks(tasks.filter((task) => task.completed));
        break;
      case 'high':
        setFilteredTasks(tasks.filter((task) => task.priority === 'high'));
        break;
      default:
        setFilteredTasks(tasks);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;

    const { data } = await addTask(user.id, newTaskTitle, newTaskPriority);
    if (data) {
      setTasks([data[0], ...tasks]);
      setNewTaskTitle('');
      setNewTaskPriority('medium');
    }
  };

  const handleToggleTask = async (taskId, completed) => {
    const { data } = await toggleTask(taskId, completed);
    if (data) {
      setTasks(tasks.map((task) => (task.id === taskId ? data[0] : task)));
    }
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const handleUpdatePriority = async (taskId, priority) => {
    const { data } = await updateTaskPriority(taskId, priority);
    if (data) {
      setTasks(tasks.map((task) => (task.id === taskId ? data[0] : task)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/30 to-slate-900">
      <Sidebar 
        currentEmotion={currentEmotion} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="lg:ml-72">
        <Header 
          user={user} 
          currentEmotion={currentEmotion} 
          onMenuToggle={() => setSidebarOpen(true)}
        />
        
        <main className="p-6">
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Tasks</h2>
                  <p className="text-gray-400">
                    {completedCount} of {totalCount} tasks completed
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={20} className="text-gray-400" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50 transition-colors"
                  >
                    <option value="all">All Tasks</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <form onSubmit={handleAddTask} className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                  placeholder="What needs to be done?"
                />
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50 transition-colors"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add
                </button>
              </form>

              <TaskList
                tasks={filteredTasks}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onUpdatePriority={handleUpdatePriority}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
