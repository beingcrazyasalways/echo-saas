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
  Camera,
  X,
  Menu
} from 'lucide-react';

export default function Sidebar({ currentEmotion, isOpen, onClose }) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Camera, label: 'Emotion', path: '/emotion' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = async () => {
    const { signOut } = await import('../lib/supabaseClient');
    await signOut();
    router.push('/login');
  };

  const getEmotionColor = () => {
    switch (currentEmotion) {
      case 'stressed': return 'text-amber-400';
      case 'calm': return 'text-teal-400';
      case 'focused': return 'text-indigo-400';
      default: return 'text-violet-400';
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-72 h-screen backdrop-blur-xl bg-slate-900/50 border-r border-white/10 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
              E.C.H.O
            </h1>
            <p className="text-xs text-gray-400 mt-2 tracking-wider uppercase">Emotion-Centric Optimizer</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  router.push(item.path);
                  onClose();
                }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/20 text-white border border-teal-400/30 shadow-lg shadow-teal-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="mb-6 px-5 py-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <Brain size={20} className={getEmotionColor()} />
              <div>
                <span className="text-gray-400 text-xs">Current</span>
                <span className={`capitalize font-semibold ml-2 ${getEmotionColor()}`}>
                  {currentEmotion || 'Not set'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-300"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
