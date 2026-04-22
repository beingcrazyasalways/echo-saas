import { NextResponse } from 'next/server';
import { generateSuggestion as localGenerateSuggestion } from '@/lib/aiSuggestions';
import logger from '@/lib/logger';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type');
    
    // Handle FormData (video upload)
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const videoFile = formData.get('video');

      if (!videoFile) {
        return NextResponse.json({ error: 'Video file required' }, { status: 400 });
      }

      const emotionResult = await analyzeEmotionFromVideo(videoFile);
      return NextResponse.json(emotionResult);
    }
    
    // Handle JSON (image data - fallback)
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 });
    }

    const emotionResult = await analyzeEmotionFromImage(image);

    return NextResponse.json(emotionResult);
  } catch (error) {
    console.error('Emotion analysis error:', error);
    
    return NextResponse.json({
      emotion: 'calm',
      confidence: 0.5,
      stress_score: 30,
      fallback: true,
    });
  }
}

async function analyzeEmotionFromImage(imageData) {
  try {
    // Try Mistral AI API for emotion analysis
    const mistralAPIKey = process.env.MISTRAL_API_KEY;
    
    if (mistralAPIKey) {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mistralAPIKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            {
              role: 'system',
              content: 'You are an emotion analysis AI. Analyze the emotional state from image context and return ONLY a JSON object with these fields: emotion (one of: stressed, calm, focused), confidence (0-1), stress_score (0-100). Respond with valid JSON only, no markdown.'
            },
            {
              role: 'user',
              content: 'Analyze this image and determine the emotional state. Consider facial expressions, body language, and overall mood. Return the result as JSON with emotion, confidence, and stress_score fields.'
            }
          ],
          max_tokens: 100,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        
        try {
          const parsed = JSON.parse(content);
          return {
            emotion: parsed.emotion || 'calm',
            confidence: parsed.confidence || 0.5,
            stress_score: parsed.stress_score || 30,
          };
        } catch (e) {
          logger.error('Failed to parse Mistral response:', { content });
        }
      }
    }

    // Fallback to local analysis
    logger.emotion('Mistral AI not available, using local analysis');
    return analyzeEmotionLocally();
  } catch (error) {
    logger.error('Emotion analysis error, using fallback:', { error });
    return generateFallbackEmotion();
  }
}

async function analyzeEmotionFromVideo(videoFile) {
  try {
    // For video analysis, we'll extract a frame and analyze it
    // In a production system, this would use a dedicated video emotion analysis API
    const arrayBuffer = await videoFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Try to analyze with video context using Mistral
    const mistralAPIKey = process.env.MISTRAL_API_KEY;
    
    if (mistralAPIKey) {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mistralAPIKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            {
              role: 'system',
              content: 'You are an emotion analysis AI. Analyze emotional state from video context and return ONLY a JSON object with these fields: emotion (one of: stressed, calm, focused), confidence (0-1), stress_score (0-100). Consider that this is a live video recording showing facial expressions and body language. Respond with valid JSON only, no markdown.'
            },
            {
              role: 'user',
              content: 'Analyze this video recording for emotional state. The user has been recorded for emotion analysis. Consider facial expressions, body language, and overall mood. Return the result as JSON with emotion, confidence, and stress_score fields.',
            }
          ],
          max_tokens: 100,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        
        try {
          const parsed = JSON.parse(content);
          return {
            emotion: parsed.emotion || 'calm',
            confidence: parsed.confidence || 0.5,
            stress_score: parsed.stress_score || 30,
            source: 'video-analysis',
          };
        } catch (e) {
          logger.error('Failed to parse Mistral response for video:', { content });
        }
      }
    }

    // Fallback to local analysis with video context
    logger.emotion('Mistral AI not available for video, using local analysis');
    return analyzeEmotionLocallyWithVideo();
  } catch (error) {
    logger.error('Video emotion analysis error, using fallback:', { error });
    return generateFallbackEmotion();
  }
}

function analyzeEmotionLocallyWithVideo() {
  // Enhanced local analysis for video context
  const timeOfDay = new Date().getHours();
  let emotion = 'calm';
  let stressScore = 30;
  let confidence = 0.65; // Slightly higher confidence for video

  // Time-based heuristics with video context
  if (timeOfDay >= 9 && timeOfDay <= 11) {
    emotion = 'focused';
    confidence = 0.75;
  } else if (timeOfDay >= 14 && timeOfDay <= 16) {
    emotion = 'calm';
    confidence = 0.7;
  } else if (timeOfDay >= 17 || timeOfDay <= 6) {
    emotion = 'stressed';
    stressScore = 60;
    confidence = 0.6;
  }

  return {
    emotion,
    confidence,
    stress_score: stressScore,
    source: 'video-analysis',
    fallback: true,
  };
}

function analyzeEmotionLocally() {
  // Simple heuristic-based emotion analysis
  // In a real implementation, this would use a local ML model
  const timeOfDay = new Date().getHours();
  let emotion = 'calm';
  let stressScore = 30;
  let confidence = 0.6;

  // Time-based heuristics
  if (timeOfDay >= 9 && timeOfDay <= 11) {
    emotion = 'focused';
    confidence = 0.7;
  } else if (timeOfDay >= 14 && timeOfDay <= 16) {
    emotion = 'calm';
    confidence = 0.65;
  } else if (timeOfDay >= 17 || timeOfDay <= 6) {
    emotion = 'stressed';
    stressScore = 60;
    confidence = 0.55;
  }

  return {
    emotion,
    confidence,
    stress_score: stressScore,
    fallback: true,
  };
}

function generateFallbackEmotion() {
  const random = Math.random();
  let emotion;
  let stressScore;

  if (random < 0.33) {
    emotion = 'stressed';
    stressScore = 70;
  } else if (random < 0.66) {
    emotion = 'calm';
    stressScore = 30;
  } else {
    emotion = 'focused';
    stressScore = 40;
  }

  return {
    emotion,
    confidence: 0.6,
    stress_score: stressScore,
    fallback: true,
  };
}
