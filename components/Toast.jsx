'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} className="text-emerald-400" />,
    error: <AlertCircle size={20} className="text-red-400" />,
    info: <Info size={20} className="text-blue-400" />,
  };

  const colors = {
    success: 'bg-emerald-500/90 border-emerald-400/30',
    error: 'bg-red-500/90 border-red-400/30',
    info: 'bg-blue-500/90 border-blue-400/30',
  };

  return (
    <div className={`fixed top-24 right-8 px-4 py-3 rounded-lg shadow-lg z-50 border ${colors[type]} text-white backdrop-blur-sm animate-slide-in`}>
      <div className="flex items-center gap-3">
        {icons[type]}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white/70 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
