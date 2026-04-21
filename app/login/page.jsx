'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '../../lib/supabaseClient';
import { Brain, Mail, Lock, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain size={40} sm:size={48} className="text-neon-cyan" />
              <h1 className="text-3xl sm:text-4xl font-bold text-white">E.C.H.O</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-400">Emotion-Centric Human Optimizer</p>
          </div>

          <div className="glass-card p-6 sm:p-8 mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
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
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-xl text-white font-semibold hover:from-teal-600 hover:to-indigo-600 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-95 min-h-[48px]"
            >
              {loading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {isSignUp ? (
                    <>
                      <UserPlus size={20} />
                      Create Account
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      Sign In
                    </>
                  )}
                </>
              )}
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
        </div>
      </div>
    </div>
  );
}
