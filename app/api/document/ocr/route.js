import { NextResponse } from 'next/server';

const MISTRAL_DOCUMENT_API_KEY = process.env.MISTRAL_DOCUMENT_API_KEY;
const MISTRAL_OCR_URL = 'https://api.mistral.ai/v1/ocr';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!MISTRAL_DOCUMENT_API_KEY) {
      return NextResponse.json({ error: 'Mistral Document API key not configured' }, { status: 500 });
    }

    // Convert file to blob for Mistral API
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    const mistralFormData = new FormData();
    mistralFormData.append('file', blob, file.name);
    mistralFormData.append('model', 'mistral-ocr-2512');

    const response = await fetch(MISTRAL_OCR_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_DOCUMENT_API_KEY}`,
      },
      body: mistralFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Mistral OCR error:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'OCR processing failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract text from Mistral OCR response
    const text = data.pages?.map(page => page.markdown || page.text).join('\n\n') || data.text || '';
    
    return NextResponse.json({ text });
  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}
