'use client';

import { Trash2, Check } from 'lucide-react';

export default function TaskItem({ task, onToggle, onDelete, onUpdatePriority }) {
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'bg-amber-500/20 text-amber-400 border-amber-400/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4 transition-all duration-300 ${
      task.completed ? 'opacity-60' : 'hover:border-white/20'
    }`}>
      <button
        onClick={() => onToggle(task.id, !task.completed)}
        className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
          task.completed
            ? 'bg-teal-500 border-teal-500'
            : 'border-gray-500 hover:border-teal-400'
        }`}
      >
        {task.completed && <Check size={14} className="text-gray-900" />}
      </button>

      <div className="flex-1">
        <p className={`text-white text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>
          {task.title}
        </p>
      </div>

      <select
        value={task.priority}
        onChange={(e) => onUpdatePriority(task.id, e.target.value)}
        className={`px-4 py-2 rounded-full text-xs font-medium border ${getPriorityColor()} bg-transparent cursor-pointer transition-all duration-300`}
      >
        <option value="low" className="bg-gray-900">Low</option>
        <option value="medium" className="bg-gray-900">Medium</option>
        <option value="high" className="bg-gray-900">High</option>
      </select>

      <button
        onClick={() => onDelete(task.id)}
        className="p-2.5 rounded-xl hover:bg-amber-500/20 transition-colors group"
      >
        <Trash2 size={18} className="text-gray-400 group-hover:text-amber-400" />
      </button>
    </div>
  );
}
