'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, supabase } from '../../lib/supabaseClient';
import { Brain, Mail, Lock, UserPlus, Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);
  const [error, setError] = useState('');

  const demoUsers = [
    { name: 'Suryansh', email: 'suryansh@echo.ai', initial: 'S' },
    { name: 'Rudra', email: 'rudra@echo.ai', initial: 'R' },
    { name: 'Sudhanshu', email: 'sudhanshu@echo.ai', initial: 'S' },
    { name: 'Nitin', email: 'nitin@echo.ai', initial: 'N' },
  ];

  const handleDemoLogin = async (user) => {
    setDemoLoading(user.email);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: 'Echo@1234',
      });

      if (error) throw error;
      if (data?.session) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(`Demo login failed for ${user.name}: ${err.message}`);
    } finally {
      setDemoLoading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password);
        if (error) throw error;
        if (data?.user) {
          router.push('/dashboard');
        }
      } else {
        const { data, error } = await signIn(email, password);
        if (error) throw error;
        if (data?.session) {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Brain size={48} className="text-neon-cyan" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              E.C.H.O
            </h1>
            <p className="text-gray-400 mt-2">Emotion-Centric Human Optimizer</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-gray-400 hover:text-neon-cyan transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <UserPlus size={16} />
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 mb-4 text-gray-400">
              <Users size={16} />
              <span className="text-sm font-medium">Demo Users (Quick Login)</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleDemoLogin(user)}
                  disabled={demoLoading !== null}
                  className="group relative flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-neon-cyan/30 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-white font-semibold text-sm group-hover:shadow-lg group-hover:shadow-neon-cyan/25 transition-shadow">
                    {demoLoading === user.email ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      user.initial
                    )}
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                    {user.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
