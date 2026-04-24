'use client';

import { useState } from 'react';
import EmotionCamera from '@/components/EmotionCamera';

export default function EmotionV2Page() {
  const [mood, setMood] = useState('calm');

  const handleEmotionDetected = (mappedEmotion) => {
    setMood(mappedEmotion);
    localStorage.setItem('currentEmotion', mappedEmotion);
  };

  const glow =
    mood === 'stressed'
      ? 'shadow-red-500/30'
      : mood === 'calm'
      ? 'shadow-blue-500/30'
      : 'shadow-cyan-500/30';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/30 to-slate-900 flex items-center justify-center p-4 ${glow} transition-all duration-500`}>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Emotion Detection V2</h1>
          <p className="text-sm sm:text-base text-gray-400">AI analyzing your mood to personalize your productivity</p>
        </div>

        <div className="glass-card p-4 sm:p-6 rounded-2xl shadow-lg transition-all duration-300">
          <EmotionCamera onEmotionDetected={handleEmotionDetected} />
        </div>

        {mood && mood !== 'calm' && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">Current mood: <span className="text-white font-semibold capitalize">{mood}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
