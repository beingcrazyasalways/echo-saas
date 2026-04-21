'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

export default function MicroNudge({ nudge, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (nudge) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [nudge, onClose]);

  if (!nudge || !visible) return null;

  const getGradient = () => {
    switch (nudge.type) {
      case 'positive':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'calming':
        return 'from-blue-500/20 to-indigo-500/20 border-blue-500/30';
      case 'motivational':
        return 'from-neon-cyan/20 to-neon-purple/20 border-neon-cyan/30';
      default:
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/30';
    }
  };

  return (
    <div className={`fixed bottom-24 left-4 z-40 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className={`glass-card px-4 py-3 flex items-center gap-3 border ${getGradient()} max-w-sm`}>
        <div className="p-2 rounded-lg bg-neon-cyan/20 flex-shrink-0">
          <Sparkles size={16} className="text-neon-cyan" />
        </div>
        <p className="text-sm text-gray-200 flex-1">{nudge.message}</p>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X size={14} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}
