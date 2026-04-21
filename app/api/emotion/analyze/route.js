import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      console.error('[Emotion] Missing image data in request');
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    console.log('[Emotion] Processing emotion analysis request');

    const emotionResult = await analyzeEmotionFromImage(image);

    return NextResponse.json(emotionResult);
  } catch (error) {
    console.error('[Emotion] Analysis error:', error);
    console.warn('[Emotion] Using fallback emotion');
    
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
      console.log('[Emotion] Using Mistral AI for emotion analysis');
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
          console.log('[Emotion] Mistral AI result:', parsed);
          return {
            emotion: parsed.emotion || 'calm',
            confidence: parsed.confidence || 0.5,
            stress_score: parsed.stress_score || 30,
          };
        } catch (e) {
          console.error('[Emotion] Failed to parse Mistral response:', content);
        }
      } else {
        console.warn('[Emotion] Mistral API request failed, status:', response.status);
      }
    }

    // Fallback to local analysis
    console.log('[Emotion] Using local analysis fallback');
    return analyzeEmotionLocally();
  } catch (error) {
    console.error('[Emotion] Analysis error, using fallback:', error);
    return generateFallbackEmotion();
  }
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

  console.log('[Emotion] Local analysis result:', { emotion, confidence, stressScore });
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

  console.log('[Emotion] Fallback emotion generated:', { emotion, stressScore });
  return {
    emotion,
    confidence: 0.6,
    stress_score: stressScore,
    fallback: true,
  };
}
