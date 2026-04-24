import { NextResponse } from 'next/server';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, emotion, stressLevel, taskLoad } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!MISTRAL_API_KEY) {
      return NextResponse.json({ error: 'Mistral API key not configured' }, { status: 500 });
    }

    // Build context-aware system prompt based on emotion
    const systemPrompt = buildSystemPrompt(emotion, stressLevel, taskLoad);

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-tiny', // Free tier optimized
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Mistral API error:', errorData);
      return NextResponse.json({ error: 'Failed to get AI response' }, { status: response.status });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    return NextResponse.json({ response: aiResponse });

  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildSystemPrompt(emotion, stressLevel, taskLoad) {
  let personality = '';
  
  // Adapt tone based on emotion
  switch (emotion) {
    case 'stressed':
      personality = `You are speaking to a stressed user (stress level: ${stressLevel || 'unknown'}). Be calm, supportive, and grounding. Suggest short breaks and help them prioritize. Use a gentle, reassuring tone.`;
      break;
    case 'focused':
      personality = `You are speaking to a focused user. Be concise, efficient, and productivity-driven. Avoid distractions. Help them maximize their flow state with brief, actionable suggestions.`;
      break;
    case 'sad':
      personality = `You are speaking to a sad user. Be empathetic, supportive, and motivational. Offer encouragement and gentle guidance. Avoid being overly cheerful - match their energy but lift it gradually.`;
      break;
    case 'happy':
      personality = `You are speaking to a happy user. Be positive and reinforce their good energy. Help them channel their positivity into productive activities.`;
      break;
    case 'calm':
      personality = `You are speaking to a calm user. Be balanced and helpful. Suggest planning, learning, or mindful activities to maintain their state.`;
      break;
    case 'angry':
      personality = `You are speaking to an angry user. Be calm, non-judgmental, and patient. Help them de-escalate and find constructive outlets for their energy.`;
      break;
    case 'fearful':
      personality = `You are speaking to a fearful user. Be reassuring and grounding. Help them break down fears into manageable steps. Avoid being dismissive.`;
      break;
    case 'disgusted':
      personality = `You are speaking to a user who is experiencing disgust. Help them address the source constructively or redirect their focus to something pleasant.`;
      break;
    case 'surprised':
      personality = `You are speaking to a surprised user. Help them process the unexpected and decide how to respond constructively.`;
      break;
    case 'neutral':
    default:
      personality = `You are speaking to a neutral user. Be balanced, helpful, and adaptive. Assess their needs and respond accordingly.`;
  }

  // Add task context if available
  let taskContext = '';
  if (taskLoad && taskLoad > 5) {
    taskContext = ' The user has a high task load. Help them prioritize and avoid overwhelm.';
  } else if (taskLoad && taskLoad > 0) {
    taskContext = ' The user has some pending tasks. Consider their workload in your suggestions.';
  }

  return `You are ECHO, an emotionally aware AI assistant for a productivity and mental wellness platform.
${personality}${taskContext}

You help users with:
- Productivity and task management
- Mental clarity and focus
- Emotional support and wellness
- Work-life balance

You MUST respond naturally like a human conversation partner. Avoid robotic tone. Keep responses concise (under 150 words) unless the user asks for more detail. Be actionable and specific in your suggestions.`;
}
