'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  LogOut,
  Brain,
  Camera
} from 'lucide-react';
import { getEmotionConfig, getEmotionDisplayName } from '@/lib/emotionConfig';

export default function Sidebar({ currentEmotion, isOpen, onClose }) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Camera, label: 'Emotion', path: '/emotion-v2' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = async () => {
    const { signOut } = await import('@/lib/supabaseClient');
    await signOut();
    router.push('/login');
  };

  const config = getEmotionConfig(currentEmotion);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <div className={`w-64 sm:w-72 h-screen backdrop-blur-xl bg-slate-900/50 border-r border-white/10 flex flex-col lg:static lg:left-auto lg:inset-auto fixed left-0 top-0 z-50 lg:z-auto transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 sm:p-6 lg:p-8 border-b border-white/10">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
            E.C.H.O
          </h1>
          <p className="text-xs text-gray-400 mt-2 tracking-wider uppercase">Emotion-Centric Optimizer</p>
        </div>

        <nav className="flex-1 p-4 sm:p-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/20 text-white border border-teal-400/30 shadow-lg shadow-teal-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 sm:p-6 border-t border-white/10">
          <div className="mb-4 sm:mb-6 px-4 sm:px-5 py-3 sm:py-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 sm:gap-3">
              <Brain className={`w-[18px] h-[18px] sm:w-5 sm:h-5 ${config.color}`} />
              <div>
                <span className="text-gray-400 text-xs">Current</span>
                <span className={`capitalize font-semibold ml-2 text-sm sm:text-base ${config.color}`}>
                  {getEmotionDisplayName(currentEmotion) || 'Not set'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 rounded-xl text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-300 text-sm sm:text-base"
          >
            <LogOut className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
