'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/supabaseClient';
import EmotionCamera from '@/components/EmotionCamera';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getEmotionConfig, getEmotionDisplayName, isCustomEmotion } from '@/lib/emotionConfig';
import { useEmotion } from '@/contexts/EmotionContext';

export default function EmotionV2Page() {
  const { currentEmotion, updateEmotion } = useEmotion();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      const { user: currentUser } = await getCurrentUser();
      if (isMounted) {
        setUser(currentUser);
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEmotionDetected = (mappedEmotion) => {
    updateEmotion(mappedEmotion);
  };

  const config = getEmotionConfig(currentEmotion);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/30 to-slate-900 ${config.glow} transition-all duration-500`}>
      <div className="flex flex-col lg:flex-row">
        <Sidebar 
          currentEmotion={currentEmotion}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 w-full min-w-0 overflow-x-hidden">
          <Header 
            user={user} 
            currentEmotion={currentEmotion}
            onMenuToggle={() => setSidebarOpen(true)}
          />
          <main className="p-3 sm:p-4 lg:p-5">
            <div className="w-full space-y-3 sm:space-y-4 lg:space-y-5">
              {/* Page Header */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
                  Emotion Detection
                </h1>
                <p className="text-sm sm:text-base text-gray-400">Analyze your mood using AI to personalize your productivity</p>
              </div>

              {/* Camera Section */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl transition-all duration-300 hover:scale-105">
                <EmotionCamera onEmotionDetected={handleEmotionDetected} />
              </div>

              {/* Current Mood Display */}
              {currentEmotion && (
                <div className={`backdrop-blur-xl bg-gradient-to-r ${config.gradient} ${config.border} rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl transition-all duration-300 hover:scale-105`}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 rounded-xl bg-white/10">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${config.color.replace('text-', 'bg-').replace('-400', '-500')}`} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Current Mood</p>
                      <p className={`text-xl sm:text-2xl lg:text-3xl font-bold capitalize ${config.color}`}>
                        {getEmotionDisplayName(currentEmotion)}
                      </p>
                      {isCustomEmotion(currentEmotion) && (
                        <p className="text-xs text-gray-400 mt-1">Custom emotion detected</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions Section */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl transition-all duration-300 hover:scale-105">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">AI Suggestions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                    <p className="text-sm text-gray-400 mb-1">Quick Action</p>
                    <p className="text-white font-medium">Log your current mood</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                    <p className="text-sm text-gray-400 mb-1">Wellness</p>
                    <p className="text-white font-medium">Take a short break</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                    <p className="text-sm text-gray-400 mb-1">Productivity</p>
                    <p className="text-white font-medium">Focus on a task</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
