'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Droplets, Zap, Camera, ArrowRight } from 'lucide-react';

export default function EmotionCard({ currentEmotion, onEmotionChange, emotionData }) {
  const router = useRouter();
  const [selectedEmotion, setSelectedEmotion] = useState(currentEmotion);

  useEffect(() => {
    setSelectedEmotion(currentEmotion);
  }, [currentEmotion]);

  const emotions = [
    { value: 'stressed', label: 'Stressed', icon: Flame, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-400/30' },
    { value: 'calm', label: 'Calm', icon: Droplets, color: 'text-teal-400', bg: 'bg-teal-500/20', border: 'border-teal-400/30' },
    { value: 'focused', label: 'Focused', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-400/30' },
  ];

  const handleEmotionSelect = (emotion) => {
    setSelectedEmotion(emotion);
    onEmotionChange(emotion);
  };

  const stressScore = emotionData?.stress_score || emotionData?.stress_level || null;
  const confidence = emotionData?.confidence ? Math.round(emotionData.confidence * 100) : null;
  const isDetected = emotionData?.source === 'detection';
  
  // Calculate time since last detection
  const getTimeSinceDetection = () => {
    if (!emotionData?.created_at) return null;
    const now = new Date();
    const detected = new Date(emotionData.created_at);
    const diffMs = now - detected;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
      <h3 className="text-xl font-semibold text-white mb-6">Current Emotion</h3>
      
      {isDetected && (
        <div className="mb-6 p-4 bg-teal-500/10 rounded-xl border border-teal-400/30">
          <div className="flex items-center gap-3 mb-2">
            <Camera size={18} className="text-teal-400" />
            <span className="text-sm text-teal-400 font-medium">Detected via Camera</span>
          </div>
          {confidence && (
            <p className="text-xs text-gray-400">Confidence: {confidence}%</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Last detected: {getTimeSinceDetection()}
          </p>
        </div>
      )}

      <div className="flex justify-center mb-8">
        <div className="relative w-32 h-32">
          <div className={`absolute inset-0 rounded-full ${emotions.find(e => e.value === currentEmotion)?.bg || 'bg-violet-500/20'} border-2 ${emotions.find(e => e.value === currentEmotion)?.border || 'border-violet-400/30'} animate-pulse`}></div>
          <div className="absolute inset-2 rounded-full bg-slate-900 flex items-center justify-center">
            {currentEmotion && (
              <div className="text-center">
                {(() => {
                  const Icon = emotions.find(e => e.value === currentEmotion)?.icon;
                  return Icon ? <Icon size={32} className={emotions.find(e => e.value === currentEmotion)?.color} /> : null;
                })()}
                <p className="text-xs text-gray-400 mt-1 capitalize">{currentEmotion}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {emotions.map((emotion) => {
          const Icon = emotion.icon;
          return (
            <button
              key={emotion.value}
              onClick={() => handleEmotionSelect(emotion.value)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                selectedEmotion === emotion.value
                  ? `${emotion.bg} ${emotion.border} border-opacity-50`
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <Icon className={`${emotion.color} mx-auto`} size={20} />
              <p className="text-xs text-white mt-2 text-center capitalize">{emotion.label}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => router.push('/emotion')}
        className="w-full py-4 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-xl text-white font-semibold hover:from-teal-600 hover:to-indigo-600 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2"
      >
        <Camera size={20} />
        Analyze Emotion
        <ArrowRight size={20} />
      </button>
    </div>
  );
}
