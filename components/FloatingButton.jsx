'use client';

import { Sparkles } from 'lucide-react';

export default function FloatingButton({ onClick, currentEmotion }) {
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
    <button
      onClick={onClick}
      className={`fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br ${getGradient()} ${getGlowColor()} flex items-center justify-center hover:scale-110 transition-transform duration-200 z-50`}
    >
      <Sparkles size={28} className="text-white" />
    </button>
  );
}
