'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSession, signOut } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { User, Mail, Shield, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedEmotion = localStorage.getItem('currentEmotion');
    if (savedEmotion) {
      setCurrentEmotion(savedEmotion);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { session } = await getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    const { user: currentUser } = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/30 to-slate-900">
      <div className="flex flex-col lg:flex-row">
        <Sidebar
          currentEmotion={currentEmotion}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 w-full min-w-0">
        <Header 
          user={user} 
          currentEmotion={currentEmotion} 
          onMenuToggle={() => setSidebarOpen(true)}
        />
        
        <main className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Settings</h2>

            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Account Information</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-white font-medium">{user?.email?.split('@')[0]}</p>
                    <p className="text-xs sm:text-sm text-gray-400">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <Mail className="text-neon-cyan" size={20} />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Email</p>
                    <p className="text-sm sm:text-base text-white">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <Shield className="text-neon-purple" size={20} />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Account Status</p>
                    <p className="text-sm sm:text-base text-green-400">Active</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Preferences</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-sm sm:text-base text-white">Email Notifications</p>
                    <p className="text-xs sm:text-sm text-gray-400">Receive task reminders</p>
                  </div>
                  <button className="px-4 py-3 sm:px-4 sm:py-3 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors text-xs sm:text-sm min-h-[44px] flex items-center justify-center">
                    Enabled
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-sm sm:text-base text-white">Dark Mode</p>
                    <p className="text-xs sm:text-sm text-gray-400">Always enabled</p>
                  </div>
                  <button className="px-4 py-3 sm:px-4 sm:py-3 bg-neon-purple/20 text-neon-purple rounded-lg text-xs sm:text-sm min-h-[44px] flex items-center justify-center">
                    Fixed
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 sm:p-6 border-red-500/30">
              <h3 className="text-base sm:text-lg font-semibold text-red-400 mb-3 sm:mb-4">Danger Zone</h3>
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={handleLogout}
                  className="w-full p-3 sm:p-4 bg-white/5 rounded-lg text-gray-300 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Shield size={18} />
                  Sign Out
                </button>
                <button className="w-full p-3 sm:p-4 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
                  <Trash2 size={18} />
                  Delete Account
                </button>
              </div>
            </div>

            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">About E.C.H.O</h3>
              <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                Emotion-Centric Human Optimizer - An AI-powered productivity system that adapts tasks and suggestions based on your emotional state.
              </p>
              <p className="text-xs text-gray-500">Version 1.0.0</p>
            </div>
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}
