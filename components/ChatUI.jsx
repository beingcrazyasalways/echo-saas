'use client';

import { useState, useEffect } from 'react';
import { Send, Sparkles, X, AlertCircle } from 'lucide-react';

export default function ChatUI({ tasks, currentEmotion, behaviorPatterns, onSuggestionUpdate, onClose, onAddTask, onDeleteTask }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear error when opening new chat
  useEffect(() => {
    setError(null);
  }, [tasks, currentEmotion]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          tasks: tasks || [],
          emotion: currentEmotion || '',
          behaviorPatterns: behaviorPatterns || null,
        }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      
      // Handle task actions
      if (data.action) {
        if (data.action.type === 'add_task' && onAddTask) {
          await onAddTask(data.action.title, data.action.priority || 'medium');
          setMessages(prev => [...prev, { role: 'system', content: `✓ Added task: "${data.action.title}"` }]);
        } else if (data.action.type === 'delete_task' && onDeleteTask) {
          await onDeleteTask(data.action.title);
          setMessages(prev => [...prev, { role: 'system', content: `✓ Deleted task: "${data.action.title}"` }]);
        }
      }
      
      if (onSuggestionUpdate && data.suggestion) {
        onSuggestionUpdate({
          message: data.message,
          suggestion: data.suggestion,
          emotion: currentEmotion,
          priority: 'medium',
          action: 'ai_suggestion',
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError('Sorry, I encountered an error. Please try again.');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neon-cyan/20">
            <Sparkles size={20} className="text-neon-cyan" />
          </div>
          <h3 className="text-lg font-semibold text-white">E.C.H.O AI</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-80">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 mx-auto max-w-fit">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Sparkles size={32} className="text-neon-cyan mx-auto mb-2 opacity-50" />
            <p>Ask E.C.H.O for help with your tasks</p>
            <p className="text-sm mt-1">I understand your emotions and provide personalized suggestions</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-neon-cyan/20 border border-neon-cyan/30 ml-8'
                  : msg.role === 'system'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 mx-auto max-w-fit'
                  : 'bg-neon-purple/20 border border-neon-purple/30 mr-8'
              }`}
            >
              <p className="text-sm text-gray-200">{msg.content}</p>
            </div>
          ))
        )}
        {loading && (
          <div className="p-3 rounded-lg bg-neon-purple/20 border border-neon-purple/30 mr-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <p className="text-sm text-gray-400 ml-2">E.C.H.O is thinking...</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for help with tasks..."
          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
