'use client';

import { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw } from 'lucide-react';

export default function FocusMode({ task, currentEmotion, onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval;
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(25 * 60);
  };

  const getGlowColor = () => {
    switch (currentEmotion) {
      case 'stressed': return 'shadow-neon-red';
      case 'calm': return 'shadow-neon-blue';
      case 'focused': return 'shadow-neon-cyan';
      default: return 'shadow-neon-purple';
    }
  };

  const getGradient = () => {
    switch (currentEmotion) {
      case 'stressed': return 'from-red-500 to-orange-500';
      case 'calm': return 'from-blue-500 to-indigo-500';
      case 'focused': return 'from-cyan-500 to-teal-500';
      default: return 'from-neon-cyan to-neon-purple';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-4 sm:p-6 lg:p-8 max-w-2xl w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={18} sm:size={20} className="text-gray-400" />
        </button>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Focus Mode</h2>
          <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">Stay focused on one task at a time</p>

          {task && (
            <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-base sm:text-lg text-white font-medium">{task.title}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {task.priority}
              </span>
            </div>
          )}

          <div className="mb-6 sm:mb-8">
            <div className={`text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r ${getGradient()} bg-clip-text text-transparent mb-3 sm:mb-4 ${getGlowColor()}`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-xs sm:text-sm text-gray-400">
              {isActive ? (isPaused ? 'Paused' : 'Stay focused!') : 'Ready to start'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            {!isActive ? (
              <button
                onClick={handleStart}
                className="px-6 sm:px-8 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Play size={18} sm:size={20} />
                Start Focus
              </button>
            ) : (
              <>
                <button
                  onClick={handlePause}
                  className="px-4 sm:px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {isPaused ? <Play size={18} sm:size={20} /> : <Pause size={18} sm:size={20} />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 sm:px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <RotateCcw size={18} sm:size={20} />
                  Reset
                </button>
              </>
            )}
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className="p-3 sm:p-4 rounded-lg bg-white/5">
              <p className="text-xl sm:text-2xl font-bold text-neon-cyan">25</p>
              <p className="text-xs text-gray-400">Minutes</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-white/5">
              <p className="text-xl sm:text-2xl font-bold text-neon-purple">1</p>
              <p className="text-xs text-gray-400">Task</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-white/5">
              <p className="text-xl sm:text-2xl font-bold text-neon-cyan">100%</p>
              <p className="text-xs text-gray-400">Focus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
