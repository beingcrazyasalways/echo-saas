'use client';

import TaskItem from './TaskItem';

export default function TaskList({ tasks, onToggle, onDelete, onUpdatePriority, currentEmotion }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-gray-400">No tasks yet. Add your first task above!</p>
      </div>
    );
  }

  const getTaskOpacity = (task) => {
    if (!currentEmotion) return 1;
    
    if (currentEmotion === 'stressed') {
      // Highlight low priority tasks, dim high priority tasks
      return task.priority === 'low' ? 1 : task.priority === 'medium' ? 0.8 : 0.5;
    }
    
    if (currentEmotion === 'focused') {
      // Highlight high priority tasks
      return task.priority === 'high' ? 1 : task.priority === 'medium' ? 0.7 : 0.4;
    }
    
    if (currentEmotion === 'calm') {
      // Show balanced tasks
      return 1;
    }
    
    return 1;
  };

  const getTaskHighlight = (task) => {
    if (!currentEmotion) return '';
    
    if (currentEmotion === 'stressed') {
      return task.priority === 'low' ? 'ring-2 ring-teal-400/50' : '';
    }
    
    if (currentEmotion === 'focused') {
      return task.priority === 'high' ? 'ring-2 ring-indigo-400/50' : '';
    }
    
    return '';
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      // Smart sorting based on emotion
      if (currentEmotion === 'stressed') {
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (currentEmotion === 'focused') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.completed ? 1 : -1;
  });

  return (
    <div className="space-y-4">
      {sortedTasks.map((task) => (
        <div 
          key={task.id} 
          style={{ opacity: getTaskOpacity(task) }}
          className={`transition-opacity duration-300 ${getTaskHighlight(task)}`}
        >
          <TaskItem
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
            onUpdatePriority={onUpdatePriority}
          />
        </div>
      ))}
    </div>
  );
}
