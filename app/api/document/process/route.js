import { NextResponse } from 'next/server';
import { processDocumentWithAI } from '@/services/aiService';

export async function POST(request) {
  try {
    const { text, action } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const result = await processDocumentWithAI(text, action);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}
