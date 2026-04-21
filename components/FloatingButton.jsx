'use client';

import { MessageSquare } from 'lucide-react';

export default function FloatingButton({ onClick, currentEmotion }) {
  const getGlow = () => {
    switch (currentEmotion) {
      case 'stressed':
        return 'shadow-amber-500/50';
      case 'calm':
        return 'shadow-teal-500/50';
      case 'focused':
        return 'shadow-indigo-500/50';
      default:
        return 'shadow-violet-500/50';
    }
  };

  const getGradient = () => {
    switch (currentEmotion) {
      case 'stressed':
        return 'from-amber-500 to-orange-500';
      case 'calm':
        return 'from-teal-500 to-cyan-500';
      case 'focused':
        return 'from-indigo-500 to-purple-500';
      default:
        return 'from-violet-500 to-pink-500';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${getGradient()} ${getGlow()} shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center z-40`}
    >
      <MessageSquare size={24} sm:size={28} className="text-white" />
    </button>
  );
}
