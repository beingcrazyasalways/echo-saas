import { NextResponse } from 'next/server';
import { mapEmotionToStressScore } from '@/lib/emotionMapping';
import logger from '@/lib/logger';

const EMOTION_API_BASE_URL = process.env.EMOTION_API_BASE_URL || 'https://echo-saas.onrender.com';

function createFallbackEmotion() {
  return {
    emotion: 'error',
    confidence: 0.0,
    stress_score: 0,
    error: 'Emotion detection service error',
    fallback: true,
  };
}

function dataUrlToFile(imageData) {
  const match = imageData?.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  const extension = mimeType.split('/')[1] || 'jpg';

  return new File([buffer], `emotion-upload.${extension}`, { type: mimeType });
}

async function forwardToEmotionService(file) {
  const formData = new FormData();
  formData.append('file', file, file.name || 'emotion-upload.jpg');

  const response = await fetch(`${EMOTION_API_BASE_URL}/detect-emotion`, {
    method: 'POST',
    body: formData,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Emotion service returned ${response.status}`);
  }

  const result = await response.json();
  return {
    ...result,
    stress_score: result.stress_score ?? mapEmotionToStressScore(result.emotion),
  };
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') || formData.get('video');

      if (!(file instanceof Blob)) {
        return NextResponse.json({ error: 'Image or video file required' }, { status: 400 });
      }

      const result = await forwardToEmotionService(file);
      return NextResponse.json(result);
    }

    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 });
    }

    const file = dataUrlToFile(image);
    if (!file) {
      return NextResponse.json({ error: 'Invalid image payload' }, { status: 400 });
    }

    const result = await forwardToEmotionService(file);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Emotion analysis proxy error:', { error: error.message || error });
    return NextResponse.json(createFallbackEmotion());
  }
}
