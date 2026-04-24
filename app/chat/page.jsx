'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/supabaseClient';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ChatUI from '@/components/ChatUI';
import { getEmotionConfig } from '@/lib/emotionConfig';

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
                  AI Assistant
                </h1>
                <p className="text-sm sm:text-base text-gray-400">Your emotionally aware productivity companion</p>
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
    </div>
  );
}
