'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, StopCircle, RefreshCw, Upload } from 'lucide-react';
import { detectEmotion } from '@/lib/emotionApi';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUser } from '@/lib/supabaseClient';
import { getEmotionConfig, getEmotionDisplayName, isCustomEmotion } from '@/lib/emotionConfig';
import { mapEmotionToStressScore, toStoredEmotion } from '@/lib/emotionMapping';

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
  const [faceAligned, setFaceAligned] = useState(false);
  const [faceInFrame, setFaceInFrame] = useState(false);
  const [detectionMode, setDetectionMode] = useState('idle'); // idle, capturing, analyzing, result_ready, cooldown
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const detectionTimerRef = useRef(null);
  const isProcessingRef = useRef(false); // Lock to prevent parallel detection
  const fallbackTimerRef = useRef(null);
  const lastDetectionTimeRef = useRef(0); // Track detection throttling

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Error loading user:', err);
    }
  };

  // Helper to check if detection should be throttled
  const shouldThrottleDetection = () => {
    const DETECTION_INTERVAL = 2500; // 2.5 seconds between detections
    const now = Date.now();
    const timeSinceLastDetection = now - lastDetectionTimeRef.current;
    return timeSinceLastDetection < DETECTION_INTERVAL;
  };

  // Helper to check face stability (simulated)
  const isFaceStable = () => {
    return isCameraActive;
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
    if (!isCameraActive || detectionMode !== 'idle') return;
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
    // Only run if auto-detect is on, camera is active, and we're in idle state
    if (!autoDetect || !isCameraActive || detectionMode !== 'idle') return;

    await detectEmotionHandler();

    // Only schedule next detection if still in idle state
    if (autoDetect && isCameraActive && detectionMode === 'idle') {
      detectionTimerRef.current = setTimeout(() => {
        runDetectionLoop();
      }, 4000); // 4 seconds between auto-detections
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
        setFaceAligned(true);
        setFaceInFrame(false);
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
    setFaceAligned(false);
    setFaceInFrame(false);
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

    // Prevent parallel detection
    if (isProcessingRef.current) {
      console.log('Detection already in progress, skipping');
      return;
    }

    // Check throttling
    if (shouldThrottleDetection()) {
      console.log('Detection throttled, please wait');
      return;
    }

    // Check face stability
    if (!isFaceStable()) {
      console.log('Face not stable, skipping detection');
      setMessage('Face not stable. Please keep still.');
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    // Set lock and state
    isProcessingRef.current = true;
    setDetectionMode('capturing');
    setIsAnalyzing(true);
    setError(null);
    setMessage('Capturing frame...');
    setEmotionResult(null);

    try {
      const blob = await captureFrame();
      if (!blob) {
        throw new Error('Failed to capture frame');
      }

      setDetectionMode('analyzing');
      setMessage('Analyzing emotion...');

      // Fallback timer for slow responses
      fallbackTimerRef.current = setTimeout(() => {
        if (isAnalyzing) {
          setMessage('Still analyzing, please wait...');
        }
      }, 3000);

      const result = await detectEmotion(blob);

      // Clear fallback timer
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }

      // Handle no_face with human feedback
      if (result.emotion === 'no_face') {
        setMessage('Face not detected. Please look at the camera');
        setDetectionMode('idle');
        return;
      }

      // Check if this is a fallback response
      if (result.fallback) {
        setError('Emotion detection service unavailable. Please try again later.');
        setDetectionMode('idle');
        return;
      }

      // Map to system emotion
      const mapped = mapEmotionToMood(result.emotion);

      // Cache last emotion
      setLastEmotion(mapped);
      lastDetectionTimeRef.current = Date.now();

      // Smooth UI update
      setEmotionResult({
        emotion: mapped,
        confidence: result.confidence,
      });

      setDetectionMode('result_ready');
      setMessage('Analysis complete!');

      // Insert into Supabase
      if (user) {
        await insertEmotion(result);
      }

      // Update dashboard live
      if (onEmotionDetected) {
        onEmotionDetected(mapped);
      }

      // Cooldown before next detection
      setDetectionMode('cooldown');
      setTimeout(() => {
        setDetectionMode('idle');
        setMessage(null);
      }, 2000);

    } catch (err) {
      console.error('Detection error:', err);
      setError('Emotion detection failed. Please try again.');
      setDetectionMode('idle');
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
      isProcessingRef.current = false;
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
      
      console.log('[DEBUG] Emotion detection result:', result);
      
      // Clear fallback timer
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
      
      // Check if this is a fallback response
      if (result.fallback) {
        console.log('[DEBUG] Fallback response detected');
        setError('Emotion detection service unavailable. Please try again later.');
        setMessage(null);
        return;
      }
      
      // Handle no_face with human feedback
      if (result.emotion === 'no_face') {
        console.log('[DEBUG] No face detected');
        setMessage('Face not detected. Please look at the camera');
        return;
      }
      
      // Handle error responses
      if (result.emotion === 'error') {
        console.log('[DEBUG] Error response:', result.error);
        setError(result.error || 'Emotion detection failed');
        setMessage(null);
        return;
      }
      
      // Map to system emotion
      const mapped = mapEmotionToMood(result.emotion);
      console.log('[DEBUG] Mapped emotion:', mapped, 'from:', result.emotion);
      
      // Cache last emotion
      setLastEmotion(mapped);
      
      setEmotionResult({
        emotion: mapped,
        confidence: result.confidence,
      });

      setMessage('Analysis complete!');

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
      setMessage(null);
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
    return toStoredEmotion(emotion);
  };

  const mapEmotionToStress = (emotion) => {
    return mapEmotionToStressScore(emotion);
  };

  const getEmotionColor = () => {
    if (!emotionResult) return 'from-gray-500 to-gray-600';
    const config = getEmotionConfig(emotionResult.emotion);
    return config.gradient || 'from-gray-500 to-gray-600';
  };

  const getEmotionGlow = () => {
    if (!emotionResult) return '';
    const config = getEmotionConfig(emotionResult.emotion);
    return config.glow || '';
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

  return (
    <div className="w-full bg-black">
      {/* Camera Preview / Uploaded Image */}
      <div className="relative h-[75vh] sm:h-[500px] w-full max-w-3xl mx-auto bg-black rounded-2xl overflow-hidden mb-4 sm:mb-6 transition-all duration-300">
        {uploadedImage ? (
          <img 
            src={uploadedImage} 
            alt="Uploaded" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'} transition-opacity duration-300`}
            />
            {!isCameraActive && (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <Camera className="w-16 h-16" />
              </div>
            )}
            
            {/* Face Frame Overlay */}
            {isCameraActive && !isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Radial gradient vignette - dark edges, clear center */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_30%,rgba(0,0,0,0.6)_100%)]" />
                
                {/* Face frame */}
                <div className={`relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 border-2 rounded-full transition-all duration-300 ${
                  faceInFrame 
                    ? 'border-green-400 shadow-[0_0_40px_rgba(74,222,128,0.4)]' 
                    : 'border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.4)] animate-pulse'
                } backdrop-blur-none bg-transparent flex items-center justify-center`}>
                  {/* Corner guides */}
                  <div className={`absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg transition-all duration-300 ${
                    faceInFrame ? 'border-green-400' : 'border-cyan-400'
                  }`} />
                  <div className={`absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg transition-all duration-300 ${
                    faceInFrame ? 'border-green-400' : 'border-cyan-400'
                  }`} />
                  <div className={`absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg transition-all duration-300 ${
                    faceInFrame ? 'border-green-400' : 'border-cyan-400'
                  }`} />
                  <div className={`absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 rounded-br-lg transition-all duration-300 ${
                    faceInFrame ? 'border-green-400' : 'border-cyan-400'
                  }`} />
                  
                  {/* Scanning line animation */}
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" />
                  </div>
                </div>

                {/* Helper text below frame */}
                <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 text-center px-4">
                  <p className={`text-sm sm:text-base font-medium transition-all duration-300 ${
                    faceInFrame ? 'text-green-400' : 'text-cyan-400'
                  }`}>
                    {faceInFrame ? '✓ Good Position' : 'Align Face Inside Frame'}
                  </p>
                  {!faceInFrame && (
                    <p className="text-xs text-gray-400 mt-1 transition-opacity duration-300">Move closer to center</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* AI Analyzing Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="animate-spin text-teal-400 mx-auto mb-3" size={32} />
              <p className="text-white text-sm sm:text-base">
                {detectionMode === 'capturing' ? 'Capturing frame...' : 
                 detectionMode === 'analyzing' ? 'Analyzing emotion...' : 
                 'Processing...'}
              </p>
              <p className="text-gray-400 text-xs mt-2">AI analyzing your mood to personalize your productivity</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls - Bottom overlay on mobile, below camera on desktop */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6 px-4 sm:px-0">
        {!isCameraActive ? (
          <>
            <button
              onClick={startCamera}
              className="flex-1 py-3 sm:py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              Start Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 sm:py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base"
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
              disabled={isAnalyzing || autoDetect || !faceAligned || detectionMode !== 'idle'}
              className="flex-1 py-3 sm:py-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              title={!faceAligned ? "Align face properly for best accuracy" : detectionMode !== 'idle' ? "Detection in progress" : ""}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                  {detectionMode === 'capturing' ? 'Capturing...' : 
                   detectionMode === 'analyzing' ? 'Analyzing...' : 
                   detectionMode === 'cooldown' ? 'Cooldown...' : 
                   'Analyzing...'}
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
              className={`flex-1 py-3 sm:py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base ${
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
              className="px-4 sm:px-3 py-3 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
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
              <p className={`text-xl sm:text-2xl font-bold capitalize ${getEmotionConfig(emotionResult.emotion).color}`}>
                {getEmotionDisplayName(emotionResult.emotion)}
              </p>
              {isCustomEmotion(emotionResult.emotion) && (
                <p className="text-xs text-gray-400 mt-1">Custom emotion detected</p>
              )}
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
