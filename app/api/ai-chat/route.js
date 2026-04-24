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
        max_tokens: 80
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
  
  // Adapt tone based on emotion - more human and conversational
  switch (emotion) {
    case 'stressed':
      personality = `Hey, I can see you're feeling stressed (stress level: ${stressLevel || 'unknown'}). Take a breath with me. I'm here to help you through this. Let's break things down into smaller pieces - what's the one thing that's weighing on you most right now?`;
      break;
    case 'focused':
      personality = `You're in the zone! I love that energy. Let's keep this momentum going. What are you working on that's got you so locked in? I'll help you stay in flow without any distractions.`;
      break;
    case 'sad':
      personality = `I notice you're feeling down today. That's okay - we all have those days. I'm here for you. Sometimes just talking through things helps. What's on your mind?`;
      break;
    case 'happy':
      personality = `Your positive energy is contagious! I love seeing you in such a good mood. Let's channel this into something great. What's making you feel so good today?`;
      break;
    case 'calm':
      personality = `You seem really centered and peaceful right now. That's a beautiful state to be in. How can I help you maintain this balance while still being productive?`;
      break;
    case 'angry':
      personality = `I can feel some frustration coming through. That's valid - anger often means something important to you is being threatened. Let's channel this energy constructively. What happened?`;
      break;
    case 'fearful':
      personality = `I sense some anxiety. That's your brain trying to protect you, but sometimes it overreacts. Let's work through this together. What's the worst that could actually happen? Often it's not as bad as our mind makes it.`;
      break;
    case 'disgusted':
      personality = `Something's really not sitting right with you. That's your gut telling you something. Let's figure out what's triggering this and either address it or shift your focus to something better.`;
      break;
    case 'surprised':
      personality = `Whoa, something unexpected happened! Surprises can be exciting or unsettling. Let's process this together. What just happened that caught you off guard?`;
      break;
    case 'neutral':
    default:
      personality = `Hey there! How are you feeling today? I'm here to help with whatever you need - whether it's productivity, mental clarity, or just someone to talk to. What's on your mind?`;
  }

  // Add task context if available
  let taskContext = '';
  if (taskLoad && taskLoad > 5) {
    taskContext = ` You've got a lot on your plate. Let's prioritize so you don't get overwhelmed.`;
  } else if (taskLoad && taskLoad > 0) {
    taskContext = ` You have some tasks to handle. Let's work through them efficiently.`;
  }

  return `You are ECHO, an emotionally aware AI assistant and friend. You're not a robot - you're a warm, understanding conversational partner who genuinely cares about the user's wellbeing.

${personality}${taskContext}

Your personality:
- Warm, empathetic, and genuinely caring
- Conversational and natural - like talking to a good friend
- Occasionally use casual language ("hey", "wow", "totally", etc.)
- Ask follow-up questions to show you're engaged
- Share brief personal observations when relevant
- Be honest when you don't know something
- Use humor appropriately to lighten the mood
- Validate feelings before offering solutions

What you help with:
- Productivity and task management (but in a supportive way, not pushy)
- Mental clarity and focus (with understanding of mental health)
- Emotional support and wellness (with genuine empathy)
- Work-life balance (respecting boundaries)

CRITICAL RULE: Respond in ONE sentence only. Maximum 20 words. No exceptions. Be direct. No filler. No explanations unless asked. Just answer the question directly.`;
}
