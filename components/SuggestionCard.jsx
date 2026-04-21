'use client';

import { Sparkles, Lightbulb, Coffee, Target, BookOpen, Brain, Zap, ArrowRight } from 'lucide-react';

export default function SuggestionCard({ suggestion, onAction }) {
  if (!suggestion) {
    return null;
  }

  const getIcon = () => {
    switch (suggestion.action) {
      case 'small_task':
      case 'quick_win':
        return Zap;
      case 'high_priority':
      case 'important':
        return Target;
      case 'plan_task':
      case 'plan_high':
      case 'learn':
        return BookOpen;
      default:
        return Lightbulb;
    }
  };

  const getGradient = () => {
    switch (suggestion.emotion) {
      case 'stressed':
        return 'from-amber-500/20 to-orange-500/20 border-amber-400/30';
      case 'focused':
        return 'from-indigo-500/20 to-teal-500/20 border-indigo-400/30';
      case 'calm':
        return 'from-teal-500/20 to-cyan-500/20 border-teal-400/30';
      default:
        return 'from-violet-500/20 to-purple-500/20 border-violet-400/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-amber-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-emerald-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return 'bg-amber-500/20 text-amber-400 border-amber-400/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const Icon = getIcon();

  return (
    <div className={`backdrop-blur-xl bg-white/5 border ${getGradient()} rounded-2xl p-8 relative overflow-hidden transition-all duration-300 shadow-2xl`}>
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <Sparkles size={64} className="text-teal-400" />
      </div>
      <div className="relative">
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-4 rounded-xl ${getGradient()} bg-opacity-10`}>
            <Icon size={28} className="text-teal-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-white mb-2">AI Suggestion</h3>
            <p className="text-gray-300 text-lg">{suggestion.message}</p>
          </div>
        </div>

        {suggestion.task && (
          <div className="mt-6 p-5 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Suggested Task</span>
              <span className={`text-xs px-3 py-2 rounded-full ${getPriorityBadge(suggestion.priority)} min-h-[32px] flex items-center justify-center`}>
                {suggestion.priority}
              </span>
            </div>
            <p className="text-white font-medium text-lg">{suggestion.task.title}</p>
          </div>
        )}

        <button
          onClick={onAction}
          className="mt-6 w-full py-4 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-xl text-white font-semibold hover:from-teal-600 hover:to-indigo-600 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2"
        >
          <ArrowRight size={20} />
          Take Action
        </button>
      </div>
    </div>
  );
}
