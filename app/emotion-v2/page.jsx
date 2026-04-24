'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/supabaseClient';
import EmotionCamera from '@/components/EmotionCamera';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function EmotionV2Page() {
  const [mood, setMood] = useState('calm');
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const handleEmotionDetected = (mappedEmotion) => {
    setMood(mappedEmotion);
    localStorage.setItem('currentEmotion', mappedEmotion);
  };

  const getEmotionGlow = () => {
    switch (mood) {
      case 'stressed': return 'shadow-red-500/30';
      case 'calm': return 'shadow-blue-500/30';
      case 'focused': return 'shadow-cyan-500/30';
      default: return 'shadow-violet-500/30';
    }
  };

  const getEmotionGradient = () => {
    switch (mood) {
      case 'stressed': return 'from-red-500/20 to-orange-500/20 border-red-400/30';
      case 'calm': return 'from-blue-500/20 to-cyan-500/20 border-blue-400/30';
      case 'focused': return 'from-cyan-500/20 to-indigo-500/20 border-cyan-400/30';
      default: return 'from-violet-500/20 to-purple-500/20 border-violet-400/30';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/30 to-slate-900 ${getEmotionGlow()} transition-all duration-500`}>
      <div className="flex flex-col lg:flex-row">
        <Sidebar 
          currentEmotion={mood}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 w-full min-w-0 overflow-x-hidden">
          <Header 
            user={user} 
            currentEmotion={mood}
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
              {mood && (
                <div className={`backdrop-blur-xl bg-gradient-to-r ${getEmotionGradient()} rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl transition-all duration-300 hover:scale-105`}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 rounded-xl bg-white/10">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${mood === 'stressed' ? 'bg-red-500' : mood === 'calm' ? 'bg-blue-500' : 'bg-cyan-500'}`} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Current Mood</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white capitalize">{mood}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions Section */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl transition-all duration-300 hover:scale-105">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">AI Suggestions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {mood === 'stressed' && (
                    <>
                      <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                        <p className="text-sm text-gray-400 mb-1">Quick Win</p>
                        <p className="text-white font-medium">Take a short break</p>
                      </div>
                      <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                        <p className="text-sm text-gray-400 mb-1">Small Task</p>
                        <p className="text-white font-medium">Complete a pending task</p>
                      </div>
                    </>
                  )}
                  {mood === 'calm' && (
                    <>
                      <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                        <p className="text-sm text-gray-400 mb-1">Planning</p>
                        <p className="text-white font-medium">Plan your day</p>
                      </div>
                      <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                        <p className="text-sm text-gray-400 mb-1">Learning</p>
                        <p className="text-white font-medium">Learn something new</p>
                      </div>
                    </>
                  )}
                  {mood === 'focused' && (
                    <>
                      <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                        <p className="text-sm text-gray-400 mb-1">High Priority</p>
                        <p className="text-white font-medium">Work on important task</p>
                      </div>
                      <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                        <p className="text-sm text-gray-400 mb-1">Deep Work</p>
                        <p className="text-white font-medium">Finish pending work</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
