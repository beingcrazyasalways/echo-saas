'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, StopCircle, RefreshCw, Upload } from 'lucide-react';
import { detectEmotion } from '@/lib/emotionApi';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUser } from '@/lib/supabaseClient';

export default function EmotionCamera({ onEmotionDetected }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionResult, setEmotionResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [user, setUser] = useState(null);
  const [autoDetect, setAutoDetect] = useState(false);
  const [message, setMessage] = useState(null);
  const [lastEmotion, setLastEmotion] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const detectionTimerRef = useRef(null);
  const isDetectingRef = useRef(false);
  const fallbackTimerRef = useRef(null);

  useEffect(() => {
    loadUser();
    // Pre-warm API
    fetch('https://echo-saas.onrender.com').catch(() => {});
  }, []);

  const loadUser = async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Error loading user:', err);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      stopAutoDetection();
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  const startAutoDetection = () => {
    if (!isCameraActive) return;
    setAutoDetect(true);
    runDetectionLoop();
  };

  const stopAutoDetection = () => {
    setAutoDetect(false);
    if (detectionTimerRef.current) {
      clearTimeout(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }
  };

  const runDetectionLoop = async () => {
    if (!autoDetect || !isCameraActive) return;

    await detectEmotionHandler();

    if (autoDetect && isCameraActive) {
      detectionTimerRef.current = setTimeout(() => {
        runDetectionLoop();
      }, 3000);
    }
  };

  const startCamera = async () => {
    try {
      setMessage('Requesting camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: false 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        setMessage('Starting camera...');
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        setError(null);
        setMessage('Camera started successfully');
        setTimeout(() => setMessage(null), 2000);
      } else {
        setError('Camera reference not found. Please refresh the page.');
      }
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError('Failed to access camera. Please check your permissions and try again.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureFrame = () => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.5);
    });
  };

  const detectEmotionHandler = async () => {
    if (!isCameraActive) {
      setError('Please start the camera first.');
      return;
    }

    // Prevent duplicate API calls
    if (isDetectingRef.current) {
      return;
    }

    isDetectingRef.current = true;
    setIsAnalyzing(true);
    setError(null);
    setMessage('Capturing image...');
    setEmotionResult(null);

    // Fallback timer for slow responses
    fallbackTimerRef.current = setTimeout(() => {
      if (isAnalyzing) {
        setMessage('Still analyzing, please wait...');
      }
    }, 3000);

    try {
      const blob = await captureFrame();
      
      if (!blob) {
        throw new Error('Failed to capture frame');
      }

      setMessage('Analyzing...');
      const result = await detectEmotion(blob);
      
      // Clear fallback timer
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
      
      // Handle no_face with human feedback
      if (result.emotion === 'no_face') {
        setMessage('Face not detected. Please look at the camera');
        return;
      }
      
      // Map to system emotion
      const mapped = mapEmotionToMood(result.emotion);
      
      // Cache last emotion
      setLastEmotion(mapped);
      
      // Smooth UI update
      setEmotionResult({
        emotion: mapped,
        confidence: result.confidence,
      });

      // Insert into Supabase
      if (user) {
        await insertEmotion(result);
      }

      // Update dashboard live
      if (onEmotionDetected) {
        onEmotionDetected(mapped);
      }
    } catch (err) {
      console.error('Detection error:', err);
      setError('Emotion detection failed. Please try again.');
      // Show last known emotion as fallback
      if (lastEmotion) {
        setEmotionResult({
          emotion: lastEmotion,
          confidence: 0.5,
        });
        setMessage(`Using last detected emotion: ${lastEmotion}`);
      }
    } finally {
      setIsAnalyzing(false);
      isDetectingRef.current = false;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Display uploaded image
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
    };
    reader.readAsDataURL(file);

    setIsAnalyzing(true);
    setError(null);
    setMessage('Capturing image...');
    setEmotionResult(null);

    // Fallback timer for slow responses
    fallbackTimerRef.current = setTimeout(() => {
      if (isAnalyzing) {
        setMessage('Still analyzing, please wait...');
      }
    }, 3000);

    try {
      setMessage('Analyzing...');
      const result = await detectEmotion(file);
      
      // Clear fallback timer
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
      
      // Handle no_face with human feedback
      if (result.emotion === 'no_face') {
        setMessage('Face not detected. Please look at the camera');
        return;
      }
      
      // Map to system emotion
      const mapped = mapEmotionToMood(result.emotion);
      
      // Cache last emotion
      setLastEmotion(mapped);
      
      setEmotionResult({
        emotion: mapped,
        confidence: result.confidence,
      });

      // Insert into Supabase
      if (user) {
        await insertEmotion(result);
      }

      // Update dashboard live
      if (onEmotionDetected) {
        onEmotionDetected(mapped);
      }
    } catch (err) {
      console.error('Detection error:', err);
      setError('Emotion detection failed. Please try again.');
      // Show last known emotion as fallback
      if (lastEmotion) {
        setEmotionResult({
          emotion: lastEmotion,
          confidence: 0.5,
        });
        setMessage(`Using last detected emotion: ${lastEmotion}`);
      }
    } finally {
      setIsAnalyzing(false);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    }
  };

  const mapEmotionToMood = (emotion) => {
    // Map backend emotions to allowed mood values in schema
    const moodMap = {
      'stressed': 'stressed',
      'angry': 'stressed',
      'fearful': 'stressed',
      'disgusted': 'stressed',
      'sad': 'stressed',
      'calm': 'calm',
      'neutral': 'calm',
      'happy': 'calm',
      'focused': 'focused',
      'surprised': 'calm',
    };
    return moodMap[emotion] || 'calm';
  };

  const mapEmotionToStress = (emotion) => {
    const stressMap = {
      'stressed': 80,
      'angry': 75,
      'fearful': 70,
      'disgusted': 60,
      'sad': 65,
      'surprised': 50,
      'happy': 30,
      'neutral': 25,
      'calm': 20,
      'focused': 25,
      'no_face': 30,
      'model_missing': 30,
    };
    return stressMap[emotion] || 30;
  };

  const insertEmotion = async (result) => {
    try {
      const mood = mapEmotionToMood(result.emotion);
      const stressLevel = mapEmotionToStress(result.emotion);

      const { error } = await supabase
        .from('emotions')
        .insert({
          user_id: user.id,
          mood: mood,
          stress_level: stressLevel,
          stress_score: stressLevel,
          confidence: result.confidence,
          source: 'ai',
        });

      if (error) {
        console.error('Error inserting emotion:', error);
      }
    } catch (err) {
      console.error('Error inserting emotion:', err);
    }
  };

  const getEmotionColor = () => {
    if (!emotionResult) return 'from-gray-500 to-gray-600';
    
    switch (emotionResult.emotion) {
      case 'stressed':
      case 'angry':
      case 'fearful':
        return 'from-red-500 to-orange-500';
      case 'calm':
      case 'neutral':
        return 'from-blue-500 to-cyan-500';
      case 'happy':
        return 'from-green-500 to-emerald-500';
      case 'focused':
        return 'from-purple-500 to-indigo-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getEmotionGlow = () => {
    if (!emotionResult) return '';
    
    switch (emotionResult.emotion) {
      case 'stressed':
      case 'angry':
      case 'fearful':
        return 'shadow-red-500/50';
      case 'calm':
      case 'neutral':
        return 'shadow-blue-500/50';
      case 'happy':
        return 'shadow-green-500/50';
      case 'focused':
        return 'shadow-cyan-500/50';
      default:
        return '';
    }
  };

  return (
    <div className="w-full">
      {/* Camera Preview / Uploaded Image */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
        {uploadedImage ? (
          <img 
            src={uploadedImage} 
            alt="Uploaded" 
            className="w-full h-full object-cover" 
          />
        ) : isCameraActive ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <Camera className="w-16 h-16" />
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* AI Analyzing Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="animate-spin text-teal-400 mx-auto mb-3" size={32} />
              <p className="text-white text-sm sm:text-base">Analyzing emotion...</p>
              <p className="text-gray-400 text-xs mt-2">AI analyzing your mood to personalize your productivity</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 sm:gap-3 mb-4">
        {!isCameraActive ? (
          <>
            <button
              onClick={startCamera}
              className="flex-1 py-2 sm:py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              Start Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              Upload Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </>
        ) : (
          <>
            <button
              onClick={detectEmotionHandler}
              disabled={isAnalyzing || autoDetect}
              className="flex-1 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  Detect Once
                </>
              )}
            </button>
            <button
              onClick={autoDetect ? stopAutoDetection : startAutoDetection}
              className={`flex-1 py-2 sm:py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base ${
                autoDetect 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500'
              }`}
            >
              {autoDetect ? (
                <>
                  <StopCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Stop Auto
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                  Auto Detect
                </>
              )}
            </button>
            <button
              onClick={stopCamera}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              <StopCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-xs sm:text-sm">{error}</p>
        </div>
      )}

      {/* No Face Message with Retry */}
      {message && (
        <div className="mb-4 p-4 sm:p-6 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
          <div className="flex justify-center mb-3">
            <Camera size={32} className="text-amber-400" />
          </div>
          <p className="text-amber-400 text-sm sm:text-base mb-4">{message}</p>
          <button
            onClick={detectEmotionHandler}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Emotion Result */}
      {emotionResult && (
        <div className={`p-4 sm:p-6 rounded-xl bg-gradient-to-r ${getEmotionColor()} bg-opacity-20 border border-white/20 shadow-lg ${getEmotionGlow()} transition-all duration-300`}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-300 mb-1">Detected Emotion</p>
              <p className="text-xl sm:text-2xl font-bold text-white capitalize">{emotionResult.emotion}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-300 mb-1">Confidence</p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {Math.round((emotionResult.confidence || 0) * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
