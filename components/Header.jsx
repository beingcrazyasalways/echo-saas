'use client';

import { User, Bell, LogOut } from 'lucide-react';
import { useTimeContext } from '../hooks/useTimeContext';

export default function Header({ user, currentEmotion, onLogout }) {
  const { greeting, sessionDuration, formattedTime } = useTimeContext();

  const getEmotionBadge = () => {
    switch (currentEmotion) {
      case 'stressed':
        return 'bg-amber-500/20 text-amber-400 border-amber-400/30';
      case 'calm':
        return 'bg-teal-500/20 text-teal-400 border-teal-400/30';
      case 'focused':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-400/30';
      default:
        return 'bg-violet-500/20 text-violet-400 border-violet-400/30';
    }
  };

  return (
    <header className="h-20 backdrop-blur-xl bg-slate-900/30 border-b border-white/10 flex items-center justify-between px-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          {greeting}
        </h2>
        <div className="flex items-center gap-4 mt-1">
          <p className="text-sm text-gray-400">
            Your AI-powered productivity companion
          </p>
          <span className="text-xs text-teal-400">•</span>
          <p className="text-xs text-gray-500">Active for {sessionDuration}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">{formattedTime}</span>
        </div>
        {currentEmotion && (
          <div className={`px-5 py-2.5 rounded-full border ${getEmotionBadge()}`}>
            <span className="text-sm font-medium capitalize">{currentEmotion}</span>
          </div>
        )}
        <button className="p-3 rounded-xl hover:bg-white/10 transition-colors">
          <Bell size={20} className="text-gray-400" />
        </button>
        <button 
          onClick={onLogout}
          className="p-3 rounded-xl hover:bg-white/10 transition-colors"
          title="Logout"
        >
          <LogOut size={20} className="text-gray-400" />
        </button>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
          <User size={24} className="text-white" />
        </div>
      </div>
    </header>
  );
}
