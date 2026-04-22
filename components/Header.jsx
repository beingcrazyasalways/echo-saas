'use client';

import { User, Bell, Menu } from 'lucide-react';
import { useTimeContext } from '../hooks/useTimeContext';
import { getPersonalizedGreeting } from '@/lib/userProfile';

export default function Header({ user, currentEmotion, onMenuToggle, userProfile, onProfileClick }) {
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

  const personalizedGreeting = getPersonalizedGreeting(userProfile);

  return (
    <header className="h-20 backdrop-blur-xl bg-slate-900/30 border-b border-white/10 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu size={24} className="text-white" />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white">
            {personalizedGreeting}
          </h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-400 hidden sm:block">
              Your AI-powered productivity companion
            </p>
            <span className="text-xs text-teal-400 hidden sm:block">•</span>
            <p className="text-xs text-gray-500 hidden sm:block">Active for {sessionDuration}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 hidden sm:flex">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400" suppressHydrationWarning>{formattedTime}</span>
        </div>
        {currentEmotion && (
          <div className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border ${getEmotionBadge()} hidden sm:block`}>
            <span className="text-sm font-medium capitalize">{currentEmotion}</span>
          </div>
        )}
        <button className="p-2 sm:p-3 rounded-xl hover:bg-white/10 transition-colors hidden sm:block">
          <Bell size={20} className="text-gray-400" />
        </button>
        <button
          onClick={onProfileClick}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all cursor-pointer"
        >
          <User size={20} className="text-white sm:hidden" />
          <User size={24} className="text-white hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
