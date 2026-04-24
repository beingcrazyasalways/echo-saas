// Dynamic emotion configuration for UI rendering
// Supports all backend emotions with fallback for unknown emotions

export const emotionConfig = {
  happy: { 
    color: 'text-yellow-400', 
    glow: 'shadow-yellow-400/40',
    gradient: 'from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-400/30'
  },
  sad: { 
    color: 'text-blue-400', 
    glow: 'shadow-blue-400/40',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-400/30'
  },
  angry: { 
    color: 'text-red-500', 
    glow: 'shadow-red-500/40',
    gradient: 'from-red-500/20 to-orange-500/20',
    border: 'border-red-400/30'
  },
  neutral: { 
    color: 'text-gray-400', 
    glow: 'shadow-gray-400/30',
    gradient: 'from-gray-500/20 to-slate-500/20',
    border: 'border-gray-400/30'
  },
  surprised: { 
    color: 'text-purple-400', 
    glow: 'shadow-purple-400/40',
    gradient: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-400/30'
  },
  fearful: { 
    color: 'text-pink-400', 
    glow: 'shadow-pink-400/40',
    gradient: 'from-pink-500/20 to-rose-500/20',
    border: 'border-pink-400/30'
  },
  disgusted: { 
    color: 'text-green-500', 
    glow: 'shadow-green-500/40',
    gradient: 'from-green-500/20 to-emerald-500/20',
    border: 'border-green-400/30'
  },
  calm: { 
    color: 'text-cyan-400', 
    glow: 'shadow-cyan-400/40',
    gradient: 'from-cyan-500/20 to-teal-500/20',
    border: 'border-cyan-400/30'
  },
  stressed: { 
    color: 'text-orange-400', 
    glow: 'shadow-orange-400/40',
    gradient: 'from-orange-500/20 to-red-500/20',
    border: 'border-orange-400/30'
  },
  focused: { 
    color: 'text-indigo-400', 
    glow: 'shadow-indigo-400/40',
    gradient: 'from-indigo-500/20 to-purple-500/20',
    border: 'border-indigo-400/30'
  },
  no_face: {
    color: 'text-gray-500',
    glow: 'shadow-gray-500/30',
    gradient: 'from-gray-500/20 to-slate-500/20',
    border: 'border-gray-500/30'
  }
};

// Get emotion config with fallback for unknown emotions
export const getEmotionConfig = (emotion) => {
  const normalizedEmotion = emotion?.toLowerCase() || 'neutral';
  return emotionConfig[normalizedEmotion] || {
    color: 'text-white',
    glow: 'shadow-violet-400/30',
    gradient: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-400/30'
  };
};

// Get emotion display name (capitalized)
export const getEmotionDisplayName = (emotion) => {
  if (!emotion) return 'Unknown';
  return emotion.charAt(0).toUpperCase() + emotion.slice(1).toLowerCase();
};

// Check if emotion is a custom/unknown emotion
export const isCustomEmotion = (emotion) => {
  const normalizedEmotion = emotion?.toLowerCase() || '';
  return !emotionConfig[normalizedEmotion];
};
