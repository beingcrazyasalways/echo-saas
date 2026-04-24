'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, X, ChevronDown, Volume2 } from 'lucide-react';

export default function VoiceMode({ currentEmotion, onClose }) {
  const [voiceState, setVoiceState] = useState('idle'); // idle, listening, thinking, speaking
  const [transcript, setTranscript] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
  const recognitionRef = useRef(null);
  const speechSynthRef = useRef(null);
  const utteranceRef = useRef(null);
  const touchStartRef = useRef(null);
  const listeningTimeoutRef = useRef(null);
  const isRecognitionActiveRef = useRef(false);
  
  const LISTENING_TIMEOUT = 5000; // 5 seconds max listening time

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Use single-shot mode for reliability
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        isRecognitionActiveRef.current = true;
        setDebugInfo('Listening...');
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech detected:', transcript);
        setDebugInfo(`Heard: "${transcript}"`);
        setTranscript(transcript);
        isRecognitionActiveRef.current = false;
        
        // Clear timeout when speech is detected
        if (listeningTimeoutRef.current) {
          clearTimeout(listeningTimeoutRef.current);
          listeningTimeoutRef.current = null;
        }
        
        // Send to AI immediately after speech is detected
        if (transcript.trim().length > 0) {
          handleSendToAI(transcript.trim());
        } else {
          handleNoSpeechDetected();
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setDebugInfo(`Error: ${event.error}`);
        isRecognitionActiveRef.current = false;
        // Clear timeout on error
        if (listeningTimeoutRef.current) {
          clearTimeout(listeningTimeoutRef.current);
          listeningTimeoutRef.current = null;
        }
        
        if (event.error === 'not-allowed') {
          setVoiceState('idle');
          alert('Microphone permission denied. Please allow microphone access to use voice mode.');
        } else if (event.error === 'no-speech') {
          // Don't auto-trigger error on no-speech, just return to idle
          setVoiceState('idle');
        } else {
          setVoiceState('idle');
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        isRecognitionActiveRef.current = false;
        setDebugInfo('Recognition ended');
        // Clear timeout on end
        if (listeningTimeoutRef.current) {
          clearTimeout(listeningTimeoutRef.current);
          listeningTimeoutRef.current = null;
        }
        
        // Only trigger error if we were listening and got no transcript
        if (voiceState === 'listening' && !isExiting && !transcript) {
          console.log('Recognition ended without speech, returning to idle');
          setVoiceState('idle');
        }
      };
    } else {
      console.log('Speech recognition not supported');
      setDebugInfo('Speech recognition not supported');
    }

    // Initialize Speech Synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthRef.current = window.speechSynthesis;
      console.log('Speech synthesis available');
    } else {
      console.log('Speech synthesis not supported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
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

    if (isRecognitionActiveRef.current) {
      console.log('Recognition already active, skipping');
      return;
    }

    try {
      setVoiceState('listening');
      setTranscript('');
      setDebugInfo('Starting listening...');
      
      // Small delay to ensure previous recognition is fully stopped
      setTimeout(() => {
        try {
          recognitionRef.current.start();
          
          // Set timeout to force stop if no speech detected
          if (listeningTimeoutRef.current) {
            clearTimeout(listeningTimeoutRef.current);
          }
          listeningTimeoutRef.current = setTimeout(() => {
            if (voiceState === 'listening' && isRecognitionActiveRef.current) {
              console.log('Listening timeout reached, stopping recognition');
              if (recognitionRef.current) {
                recognitionRef.current.stop();
              }
              setVoiceState('idle');
              setDebugInfo('Timeout - no speech detected');
            }
          }, LISTENING_TIMEOUT);
        } catch (e) {
          console.error('Failed to start recognition:', e);
          setVoiceState('idle');
          setDebugInfo('Failed to start recognition');
        }
      }, 200);
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setVoiceState('idle');
      setDebugInfo('Failed to start recognition');
    }
  };

  const handleNoSpeechDetected = () => {
    setVoiceState('speaking');
    setTranscript('');
    
    const errorMessage = "Sorry, I didn't catch that. Could you please speak again?";
    speak(errorMessage);
  };

  const handleSendToAI = async (text) => {
    setVoiceState('thinking');
    setTranscript('');
    setDebugInfo('Sending to AI...');

    try {
      const stressLevel = localStorage.getItem('stressLevel') || null;
      const taskLoad = 0;

      console.log('Sending to AI:', text);
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
      console.log('AI response:', data);
      const aiResponse = data.response || 'Sorry, I could not generate a response.';
      setDebugInfo(`AI: "${aiResponse.substring(0, 50)}..."`);

      setVoiceState('speaking');
      speak(aiResponse);
    } catch (error) {
      console.error('AI error:', error);
      setDebugInfo('AI connection error');
      setVoiceState('speaking');
      const errorMessage = "Sorry, I'm having trouble connecting. Please try again.";
      speak(errorMessage);
    }
  };

  const speak = (text) => {
    if (!speechSynthRef.current) {
      console.log('Speech synthesis not available');
      setVoiceState('idle');
      return;
    }

    console.log('Speaking:', text);
    setDebugInfo('Speaking...');

    // Cancel any ongoing speech
    speechSynthRef.current.cancel();

    // Unlock audio on mobile (user gesture)
    if (speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower for natural tone
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      console.log('Speech synthesis started');
      setDebugInfo('Speaking...');
    };

    utterance.onend = () => {
      console.log('Speech synthesis ended');
      setDebugInfo('Speech ended');
      setVoiceState('idle'); // Return to idle instead of auto-restarting
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setDebugInfo('Speech error');
      setVoiceState('idle'); // Return to idle on error
    };

    utteranceRef.current = utterance;
    
    // Small delay to ensure audio context is ready
    setTimeout(() => {
      speechSynthRef.current.speak(utterance);
    }, 100);
  };

  const handleMicClick = () => {
    // Always clear everything first for fresh start
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
    }
    isRecognitionActiveRef.current = false;
    
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    
    // Reset state
    setVoiceState('idle');
    setTranscript('');
    setDebugInfo('');
    
    // Start fresh listening
    setTimeout(() => {
      startListening();
    }, 300);
  };

  const handleExit = () => {
    setIsExiting(true);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
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
          {debugInfo && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <p className="text-xs text-cyan-400 font-mono">{debugInfo}</p>
            </div>
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
            {voiceState === 'listening' && 'Listening...'}
            {voiceState === 'thinking' && 'Processing your request...'}
            {voiceState === 'speaking' && 'Listening to response...'}
          </p>
          <p className="text-white/30 text-xs mt-2">Tap microphone anytime to restart</p>
        </div>
      </div>

      {/* Swipe hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <p className="text-white/40 text-xs">Swipe down to exit</p>
      </div>
    </div>
  );
}
