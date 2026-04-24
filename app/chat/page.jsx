'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/supabaseClient';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ChatUI from '@/components/ChatUI';
import VoiceMode from '@/components/VoiceMode';
import { getEmotionConfig } from '@/lib/emotionConfig';

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);
    
    // Load current emotion from localStorage
    const savedEmotion = localStorage.getItem('currentEmotion');
    if (savedEmotion) {
      setCurrentEmotion(savedEmotion);
    }
  }, []);

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
          <main className="p-3 sm:p-4 lg:p-5 h-[calc(100vh-64px)]">
            <div className="w-full h-full">
              {/* Page Header */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
                      AI Assistant
                    </h1>
                    <p className="text-sm sm:text-base text-gray-400">Your emotionally aware productivity companion</p>
                  </div>
                  <button
                    onClick={() => setVoiceModeOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    Voice Mode
                  </button>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl h-[calc(100%-120px)] overflow-hidden">
                <ChatUI 
                  currentEmotion={currentEmotion}
                  onEmotionChange={setCurrentEmotion}
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Voice Mode Overlay */}
      {voiceModeOpen && (
        <VoiceMode 
          currentEmotion={currentEmotion}
          onClose={() => setVoiceModeOpen(false)}
        />
      )}
    </div>
  );
}
