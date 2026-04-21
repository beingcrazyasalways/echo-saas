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
      <Sidebar 
        currentEmotion={currentEmotion} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="w-full">
        <Header 
          user={user} 
          currentEmotion={currentEmotion} 
          onMenuToggle={() => setSidebarOpen(true)}
        />
        
        <main className="p-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Settings</h2>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                    <User size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{user?.email?.split('@')[0]}</p>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                  <Mail className="text-neon-cyan" size={24} />
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                  <Shield className="text-neon-purple" size={24} />
                  <div>
                    <p className="text-gray-400 text-sm">Account Status</p>
                    <p className="text-green-400">Active</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white">Email Notifications</p>
                    <p className="text-gray-400 text-sm">Receive task reminders</p>
                  </div>
                  <button className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors">
                    Enabled
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white">Dark Mode</p>
                    <p className="text-gray-400 text-sm">Always enabled</p>
                  </div>
                  <button className="px-4 py-2 bg-neon-purple/20 text-neon-purple rounded-lg">
                    Fixed
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border-red-500/30">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <button
                  onClick={handleLogout}
                  className="w-full p-4 bg-white/5 rounded-lg text-gray-300 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Shield size={20} />
                  Sign Out
                </button>
                <button className="w-full p-4 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                  <Trash2 size={20} />
                  Delete Account
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-2">About E.C.H.O</h3>
              <p className="text-gray-400 text-sm mb-4">
                Emotion-Centric Human Optimizer - An AI-powered productivity system that adapts tasks and suggestions based on your emotional state.
              </p>
              <p className="text-gray-500 text-xs">Version 1.0.0</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
