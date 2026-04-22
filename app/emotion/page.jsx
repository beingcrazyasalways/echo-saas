'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSession } from '../../lib/supabaseClient';
import { logEmotionFromDetection } from '../../lib/emotions';
import { generateSuggestion } from '../../lib/aiSuggestions';
import { useTimeContext } from '../../hooks/useTimeContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Camera, Upload, Video, MicOff, Mic, X, RefreshCw, AlertCircle, Clock, Lightbulb } from 'lucide-react';

export default function EmotionPage() {
  const router = useRouter();
  const { formattedTime, timeOfDay } = useTimeContext();
  const [mode, setMode] = useState('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionResult, setEmotionResult] = useState(null);
  const [error, setError] = useState(null);
  const [enableTracking, setEnableTracking] = useState(true);
  const [user, setUser] = useState(null);
  const [currentEmotion, setCurrentEmotion] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const savedEmotion = localStorage.getItem('currentEmotion');
    if (savedEmotion) {
      setCurrentEmotion(savedEmotion);
    }
  }, []);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureAndAnalyze = async () => {
    if (!enableTracking) {
      setError('Please enable emotion tracking first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      if (mode === 'camera' && videoRef.current) {
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        await analyzeEmotion(imageData);
      } else if (mode === 'image' && fileInputRef.current?.files[0]) {
        const file = fileInputRef.current.files[0];
        const imageData = await fileToDataURL(file);
        await analyzeEmotion(imageData);
      } else if (mode === 'video' && fileInputRef.current?.files[0]) {
        await analyzeVideo(fileInputRef.current.files[0]);
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const analyzeVideo = async (videoFile) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    await video.play();
    
    const frames = [];
    const duration = video.duration;
    const interval = 0.5;
    
    for (let time = 0; time < duration; time += interval) {
      video.currentTime = time;
      await new Promise(resolve => video.onseeked = resolve);
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      frames.push(canvas.toDataURL('image/jpeg'));
    }
    
    const results = await Promise.all(frames.map(frame => analyzeEmotion(frame, false)));
    const avgResult = averageEmotionResults(results);
    setEmotionResult(avgResult);
  };

  const analyzeEmotion = async (imageData, updateState = true) => {
    const response = await fetch('/api/emotion/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData }),
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    const result = await response.json();
    if (updateState) {
      setEmotionResult(result);
      
      if (user && result) {
        await logEmotionFromDetection(user.id, result.emotion, result.confidence, result.stress_score);
        
        localStorage.setItem('currentEmotion', result.emotion);
        
        await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `I'm feeling ${result.emotion}`,
            tasks: [],
            emotion: result.emotion,
          }),
        });
      }
    }
    return result;
  };

  const averageEmotionResults = (results) => {
    const emotions = results.filter(r => r !== null);
    if (emotions.length === 0) return null;

    const avgEmotion = emotions.reduce((acc, curr) => {
      const emotionMap = { stressed: 0, calm: 0, focused: 0 };
      emotionMap[curr.emotion]++;
      return emotionMap;
    }, { stressed: 0, calm: 0, focused: 0 });

    const dominant = Object.keys(avgEmotion).reduce((a, b) => 
      avgEmotion[a] > avgEmotion[b] ? a : b
    );

    const avgConfidence = emotions.reduce((sum, r) => sum + r.confidence, 0) / emotions.length;
    const avgStress = emotions.reduce((sum, r) => sum + r.stress_score, 0) / emotions.length;

    return {
      emotion: dominant,
      confidence: avgConfidence,
      stress_score: avgStress,
    };
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (mode === 'video' && (file.size > 10 * 1024 * 1024 || !file.type.startsWith('video/'))) {
        setError('Please upload a video file under 10MB.');
        return;
      }
      setError(null);
    }
  };

  const getEmotionColor = () => {
    if (!emotionResult) return 'from-neon-purple to-neon-cyan';
    switch (emotionResult.emotion) {
      case 'stressed': return 'from-red-500 to-orange-500';
      case 'calm': return 'from-blue-500 to-indigo-500';
      case 'focused': return 'from-cyan-500 to-teal-500';
      default: return 'from-neon-purple to-neon-cyan';
    }
  };

  const getEmotionGlow = () => {
    if (!emotionResult) return '';
    switch (emotionResult.emotion) {
      case 'stressed': return 'shadow-amber-500/30';
      case 'calm': return 'shadow-teal-500/30';
      case 'focused': return 'shadow-indigo-500/30';
      default: return 'shadow-violet-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="flex flex-col lg:flex-row">
        <Sidebar
          currentEmotion={currentEmotion}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 w-full min-w-0">
        <Header 
          user={user} 
          currentEmotion={currentEmotion} 
          onLogout={async () => {
            await signOut();
            router.push('/login');
          }}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        
        <div className="p-4 sm:p-8">
          <div className="w-full space-y-6 sm:space-y-8">
            <div className="glass-card p-4 sm:p-8 mb-6">
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                Emotion Intelligence
              </h1>
              <p className="text-sm sm:text-base text-gray-400">Let E.C.H.O understand how you're feeling</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-card p-4 sm:p-6 lg:col-span-2">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Input Mode</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <button
                    onClick={() => { setMode('camera'); stopCamera(); }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      mode === 'camera'
                        ? 'border-neon-cyan bg-neon-cyan/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Camera className="w-6 h-6 mx-auto mb-2 text-neon-cyan" />
                    <p className="text-xs sm:text-sm text-white">Live Camera</p>
                  </button>
                  <button
                    onClick={() => { setMode('image'); stopCamera(); }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      mode === 'image'
                        ? 'border-neon-cyan bg-neon-cyan/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-neon-cyan" />
                    <p className="text-xs sm:text-sm text-white">Upload Image</p>
                  </button>
                  <button
                    onClick={() => { setMode('video'); stopCamera(); }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      mode === 'video'
                        ? 'border-neon-cyan bg-neon-cyan/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Video className="w-6 h-6 mx-auto mb-2 text-neon-cyan" />
                    <p className="text-xs sm:text-sm text-white">Upload Video</p>
                  </button>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={enableTracking}
                      onChange={(e) => setEnableTracking(e.target.checked)}
                      className="w-5 h-5 rounded accent-neon-cyan"
                    />
                    <div>
                      <p className="text-sm sm:text-base text-white font-medium">Enable Emotion Tracking</p>
                      <p className="text-xs sm:text-sm text-gray-400">Your data is used to improve your productivity experience</p>
                    </div>
                  </label>
                </div>

                {mode === 'camera' && (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      {isCameraActive ? (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <Camera className="w-16 h-16" />
                        </div>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="flex gap-3">
                      {!isCameraActive ? (
                        <button
                          onClick={startCamera}
                          className="flex-1 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                          <Camera size={20} />
                          Start Camera
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={captureAndAnalyze}
                            disabled={isAnalyzing || !enableTracking}
                            className="flex-1 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Camera size={20} />}
                            {isAnalyzing ? 'Analyzing...' : 'Capture & Analyze'}
                          </button>
                          <button
                            onClick={stopCamera}
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                          >
                            <MicOff size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {(mode === 'image' || mode === 'video') && (
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={mode === 'video' ? 'video/*' : 'image/*'}
                      onChange={handleFileChange}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-neon-cyan/20 file:text-neon-cyan hover:file:bg-neon-cyan/30"
                    />
                    {mode === 'video' && (
                      <p className="text-sm text-gray-400">Upload a 2-10 second video (max 10MB)</p>
                    )}
                    <button
                      onClick={captureAndAnalyze}
                      disabled={isAnalyzing || !enableTracking || !fileInputRef.current?.files[0]}
                      className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Camera size={20} />}
                      {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30 flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}
              </div>

              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Analysis Result</h2>
                {emotionResult ? (
                  <div className="space-y-6">
                    <div className={`p-6 rounded-lg bg-gradient-to-r ${getEmotionColor()} bg-opacity-20 border border-white/20`}>
                      <p className="text-sm text-gray-300 mb-1">Detected Emotion</p>
                      <p className="text-3xl font-bold text-white capitalize">{emotionResult.emotion}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-white/5">
                        <p className="text-sm text-gray-400 mb-1">Confidence</p>
                        <p className="text-2xl font-bold text-neon-cyan">{Math.round(emotionResult.confidence * 100)}%</p>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5">
                        <p className="text-sm text-gray-400 mb-1">Stress Score</p>
                        <p className={`text-2xl font-bold ${
                          emotionResult.stress_score > 70 ? 'text-red-400' :
                          emotionResult.stress_score > 40 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {Math.round(emotionResult.stress_score)}%
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-gray-400 mb-2">AI Insight</p>
                      <p className="text-white">
                        {emotionResult.emotion === 'stressed' && "You're showing signs of stress. Take a deep breath and consider starting with a small task."}
                        {emotionResult.emotion === 'calm' && "You're in a calm state. This is a great time for planning or learning."}
                        {emotionResult.emotion === 'focused' && "You're focused and ready to tackle important tasks. Go for the high-priority items!"}
                      </p>
                    </div>

                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Capture or upload to analyze your emotion</p>
                  </div>
                )}
              </div>

              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Detection Info</h2>
                
                {emotionResult ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-teal-400" />
                        <span className="text-sm text-gray-400">Detected at</span>
                      </div>
                      <p className="text-white font-medium">{formattedTime}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain size={16} className="text-teal-400" />
                        <span className="text-sm text-gray-400">Emotion</span>
                      </div>
                      <p className="text-white font-medium capitalize">{emotionResult.emotion}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className="text-teal-400" />
                        <span className="text-sm text-gray-400">Confidence</span>
                      </div>
                      <p className="text-white font-medium">{Math.round(emotionResult.confidence * 100)}%</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb size={16} className="text-teal-400" />
                        <span className="text-sm text-gray-400">AI Suggestion</span>
                      </div>
                      <p className="text-white text-sm">
                        {(() => {
                          const suggestion = generateSuggestion([], emotionResult.emotion);
                          return suggestion.message;
                        })()}
                      </p>
                    </div>

                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full py-3 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-xl text-white font-semibold hover:from-teal-600 hover:to-indigo-600 transition-all shadow-lg shadow-teal-500/25"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Waiting for detection</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
