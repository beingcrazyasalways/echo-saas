'use client';

import { useRouter } from 'next/navigation';
import { Camera, ArrowRight } from 'lucide-react';

export default function EmotionCard({ currentEmotion, emotionData }) {
  const router = useRouter();

  const emotions = [
    { value: 'stressed', label: 'Stressed', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-400/30' },
    { value: 'calm', label: 'Calm', color: 'text-teal-400', bg: 'bg-teal-500/20', border: 'border-teal-400/30' },
    { value: 'focused', label: 'Focused', color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-400/30' },
  ];

  const stressScore = emotionData?.stress_score || emotionData?.stress_level || null;
  const confidence = emotionData?.confidence ? Math.round(emotionData.confidence * 100) : null;
  const isDetected = emotionData?.source === 'detection' || emotionData?.source === 'ai';
  
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
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl">
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Current Emotion</h3>
      
      {isDetected && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-teal-500/10 rounded-xl border border-teal-400/30">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Camera className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-teal-400" />
            <span className="text-xs sm:text-sm text-teal-400 font-medium">Detected via Camera</span>
          </div>
          {confidence && (
            <p className="text-xs text-gray-400">Confidence: {confidence}%</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Last detected: {getTimeSinceDetection()}
          </p>
        </div>
      )}

      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
          <div className={`absolute inset-0 rounded-full ${emotions.find(e => e.value === currentEmotion)?.bg || 'bg-violet-500/20'} border-2 ${emotions.find(e => e.value === currentEmotion)?.border || 'border-violet-400/30'} animate-pulse`}></div>
          <div className="absolute inset-2 rounded-full bg-slate-900 flex items-center justify-center">
            {currentEmotion && (
              <div className="text-center">
                <p className={`text-lg sm:text-2xl font-bold capitalize ${emotions.find(e => e.value === currentEmotion)?.color}`}>{currentEmotion}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push('/emotion-v2')}
        className="w-full py-3 sm:py-4 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-xl text-white font-semibold hover:from-teal-600 hover:to-indigo-600 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 text-sm sm:text-base"
      >
        <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
        Analyze Emotion
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
}
