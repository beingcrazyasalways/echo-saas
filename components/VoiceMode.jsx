'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, X, ChevronDown, Volume2 } from 'lucide-react';

export default function VoiceMode({ currentEmotion, onClose }) {
  const [voiceState, setVoiceState] = useState('idle'); // idle, listening, thinking, speaking
  const [transcript, setTranscript] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  
  const recognitionRef = useRef(null);
  const speechSynthRef = useRef(null);
  const utteranceRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const touchStartRef = useRef(null);
  const lastSpeechTimeRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');
  const noSpeechTimeoutRef = useRef(null);
  const listeningStartTimeRef = useRef(null);
  
  const SILENCE_THRESHOLD = 1500; // 1.5 seconds of silence before sending
  const NO_SPEECH_TIMEOUT = 5000; // 5 seconds with no speech before error

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Update accumulated transcript
        if (finalTranscript) {
          accumulatedTranscriptRef.current += finalTranscript;
          lastSpeechTimeRef.current = Date.now();
          
          // Clear no-speech timeout when speech is detected
          if (noSpeechTimeoutRef.current) {
            clearTimeout(noSpeechTimeoutRef.current);
            noSpeechTimeoutRef.current = null;
          }
        }

        // Display current state
        setTranscript(accumulatedTranscriptRef.current + interimTranscript);

        // Reset and restart silence timer on any speech
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Start silence timer if we have content
        if (accumulatedTranscriptRef.current || interimTranscript) {
          silenceTimerRef.current = setTimeout(() => {
            const finalText = accumulatedTranscriptRef.current.trim();
            if (finalText.length > 2) { // Only send if we have meaningful content
              handleSendToAI(finalText);
            }
          }, SILENCE_THRESHOLD);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceState('idle');
          alert('Microphone permission denied. Please allow microphone access to use voice mode.');
        } else if (event.error === 'no-speech') {
          // No speech detected, just restart
          if (voiceState === 'listening' && !isExiting) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if still in listening state
        if (voiceState === 'listening' && !isExiting) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
          }
        }
      };
    }

    // Initialize Speech Synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, [voiceState, isExiting]);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    try {
      recognitionRef.current.start();
      setVoiceState('listening');
      setTranscript('');
      accumulatedTranscriptRef.current = '';
      listeningStartTimeRef.current = Date.now();

      // Set no-speech timeout
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }
      noSpeechTimeoutRef.current = setTimeout(() => {
        if (voiceState === 'listening' && accumulatedTranscriptRef.current.trim().length < 2) {
          handleNoSpeechDetected();
        }
      }, NO_SPEECH_TIMEOUT);
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  };

  const handleNoSpeechDetected = () => {
    stopListening();
    setVoiceState('speaking');
    setTranscript('');
    accumulatedTranscriptRef.current = '';
    
    const errorMessage = "Sorry, I didn't catch that. Could you please speak again?";
    speak(errorMessage);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
      noSpeechTimeoutRef.current = null;
    }
  };

  const handleSendToAI = async (text) => {
    stopListening();
    setVoiceState('thinking');
    setTranscript('');
    accumulatedTranscriptRef.current = ''; // Reset accumulated transcript

    try {
      const stressLevel = localStorage.getItem('stressLevel') || null;
      const taskLoad = 0;

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          emotion: currentEmotion || 'neutral',
          stressLevel: stressLevel,
          taskLoad: taskLoad,
        }),
      });

      const data = await response.json();
      const aiResponse = data.response || 'Sorry, I could not generate a response.';

      setVoiceState('speaking');
      speak(aiResponse);
    } catch (error) {
      console.error('AI error:', error);
      setVoiceState('speaking');
      const errorMessage = "Sorry, I'm having trouble connecting. Please try again.";
      speak(errorMessage);
    }
  };

  const speak = (text) => {
    if (!speechSynthRef.current) {
      setVoiceState('idle');
      return;
    }

    // Cancel any ongoing speech
    speechSynthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower for natural tone
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setVoiceState('listening');
      startListening();
    };

    utterance.onerror = () => {
      setVoiceState('listening');
      startListening();
    };

    utteranceRef.current = utterance;
    speechSynthRef.current.speak(utterance);
  };

  const handleMicClick = () => {
    if (voiceState === 'idle') {
      startListening();
    } else if (voiceState === 'listening') {
      stopListening();
      setVoiceState('idle');
    } else if (voiceState === 'speaking') {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
      setVoiceState('idle');
    }
  };

  const handleExit = () => {
    setIsExiting(true);
    stopListening();
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Swipe down gesture handling
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartRef.current;
    
    if (diff > 100) {
      handleExit();
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center transition-opacity duration-300 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute top-8 left-1/2 -translate-x-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <ChevronDown size={24} className="text-white" />
      </button>

      {/* Close button */}
      <button
        onClick={handleExit}
        className="absolute top-8 right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X size={24} className="text-white" />
      </button>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md px-8">
        {/* State indicator */}
        <div className="mb-8 text-center">
          <p className="text-white/60 text-sm uppercase tracking-wider mb-2">
            {voiceState === 'idle' && 'Tap to start'}
            {voiceState === 'listening' && 'Listening...'}
            {voiceState === 'thinking' && 'Thinking...'}
            {voiceState === 'speaking' && 'Speaking...'}
          </p>
          {transcript && (
            <p className="text-white text-lg font-medium">{transcript}</p>
          )}
        </div>

        {/* Mic button with animations */}
        <div className="relative">
          {/* Pulsing ring for listening */}
          {voiceState === 'listening' && (
            <div className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping" />
          )}
          
          {/* Outer ring */}
          <div className={`absolute inset-[-20px] rounded-full border-2 transition-all duration-300 ${
            voiceState === 'listening' 
              ? 'border-cyan-400 animate-pulse' 
              : voiceState === 'thinking'
              ? 'border-purple-400 animate-spin'
              : voiceState === 'speaking'
              ? 'border-teal-400'
              : 'border-white/20'
          }`} />

          {/* Main button */}
          <button
            onClick={handleMicClick}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              voiceState === 'idle'
                ? 'bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10'
                : voiceState === 'listening'
                ? 'bg-gradient-to-br from-cyan-500/30 to-cyan-600/30'
                : voiceState === 'thinking'
                ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/30'
                : 'bg-gradient-to-br from-teal-500/30 to-teal-600/30'
            }`}
          >
            {voiceState === 'idle' && <Mic size={48} className="text-white" />}
            {voiceState === 'listening' && <Mic size={48} className="text-cyan-400" />}
            {voiceState === 'thinking' && (
              <div className="animate-spin">
                <Volume2 size={48} className="text-purple-400" />
              </div>
            )}
            {voiceState === 'speaking' && <Volume2 size={48} className="text-teal-400" />}
          </button>
        </div>

        {/* Waveform animation for speaking */}
        {voiceState === 'speaking' && (
          <div className="flex items-center justify-center gap-1 mt-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-teal-400 rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.random() * 30}px`,
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 text-center">
          <p className="text-white/40 text-sm">
            {voiceState === 'idle' && 'Tap the microphone to start voice conversation'}
            {voiceState === 'listening' && 'Speak naturally. I\'ll listen until you pause.'}
            {voiceState === 'thinking' && 'Processing your request...'}
            {voiceState === 'speaking' && 'Listening to response...'}
          </p>
        </div>
      </div>

      {/* Swipe hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <p className="text-white/40 text-xs">Swipe down to exit</p>
      </div>
    </div>
  );
}
