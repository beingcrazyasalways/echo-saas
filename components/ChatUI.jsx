'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { Send, Sparkles, X, Mic, Volume2, VolumeX } from 'lucide-react';

function ChatUI({ currentEmotion, onEmotionChange, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Get stress level from localStorage or default
      const stressLevel = localStorage.getItem('stressLevel') || null;
      
      // Get task load (simplified - could be enhanced)
      const taskLoad = 0; // Will be enhanced later

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          emotion: currentEmotion || 'neutral',
          stressLevel: stressLevel,
          taskLoad: taskLoad,
        }),
      });

      const data = await response.json();
      
      const assistantMessage = data.response || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

      // Text-to-Speech if enabled
      if (speechEnabled && window.speechSynthesis) {
        speak(assistantMessage);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (!speechEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/20">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/20">
            <Sparkles size={20} className="text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">E.C.H.O AI</h3>
            <p className="text-xs text-gray-400">Emotion-aware assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSpeech}
            className={`p-2 rounded-lg transition-colors ${
              speechEnabled ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-gray-400'
            }`}
            title={speechEnabled ? 'Disable speech' : 'Enable speech'}
          >
            {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Sparkles size={48} className="text-teal-400 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Hi, I'm E.C.H.O</p>
            <p className="text-sm">Your emotionally aware AI assistant</p>
            <p className="text-xs mt-4 text-gray-500">I adapt to your mood and help with productivity</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] p-3 sm:p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-teal-500/30 to-cyan-500/30 border border-teal-400/30'
                      : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <p className="text-sm sm:text-base text-gray-200 whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/20 p-3 sm:p-4 rounded-2xl flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-sm text-gray-400">Thinking...</p>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={loading}
            className={`p-3 rounded-xl transition-colors ${
              isListening 
                ? 'bg-red-500/20 text-red-400 animate-pulse' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
            title={isListening ? 'Listening...' : 'Voice input'}
          >
            <Mic size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or speak your message..."
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-400/50 transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 sm:px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default memo(ChatUI);
