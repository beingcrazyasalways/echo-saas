import { NextResponse } from 'next/server';
import { generateSuggestion as localGenerateSuggestion } from '@/lib/aiSuggestions';
import { getBehaviorContext } from '@/lib/behavior';
import logger from '@/lib/logger';

const SYSTEM_PROMPT = `You are E.C.H.O, an emotionally intelligent AI assistant.

You understand the user's emotional state and provide personalized suggestions for:
- Task management
- Productivity advice
- Stress management
- General recommendations
- Activity suggestions
- Personal growth

If the user is stressed:
- simplify suggestions
- reduce cognitive load
- suggest small, easy actions
- recommend breaks, breathing exercises, or relaxing activities

If focused:
- push high priority tasks
- be direct and action-oriented
- suggest deep work sessions
- recommend maintaining flow

If calm:
- suggest planning, learning, or optimization
- recommend reflection or goal-setting
- suggest organizing or reviewing progress

Always:
- be concise
- be supportive
- be practical
- avoid long paragraphs
- personalize based on user's current state and patterns
- consider user's behavior patterns when making suggestions
- adapt your tone based on user's profile (if provided)

You can add or delete tasks for the user. When the user asks to add a task, you MUST include the action in your JSON response with the action field. The action format is: { "type": "add_task", "title": "task title", "priority": "low|medium|high" }. When the user asks to delete a task, use: { "type": "delete_task", "title": "task title" }.

IMPORTANT: Always include the action field in your JSON when the user requests to add or delete a task. Do not just mention it in the message - it must be in the action field.

Respond in JSON format with this structure:
{
  "message": "short response",
  "suggestion": "actionable next step or personalized advice",
  "action": null | { "type": "add_task" | "delete_task", "title": "task title", "priority": "low|medium|high" }
}`;

function extractTaskAction(text) {
  if (!text) {
    return null;
  }

  const normalized = text.trim();
  const addMatch = normalized.match(/(?:add|create)\s+(?:a\s+)?(?:task\s+)?(?:"([^"]+)"|'([^']+)'|(.+?))(?:\s+(?:with\s+)?priority\s+(low|medium|high))?$/i);
  if (addMatch) {
    const title = (addMatch[1] || addMatch[2] || addMatch[3] || '').trim();
    if (title) {
      return {
        type: 'add_task',
        title,
        priority: (addMatch[4] || 'medium').toLowerCase(),
      };
    }
  }

  const deleteMatch = normalized.match(/(?:delete|remove)\s+(?:the\s+)?(?:task\s+)?(?:"([^"]+)"|'([^']+)'|(.+))$/i);
  if (deleteMatch) {
    const title = (deleteMatch[1] || deleteMatch[2] || deleteMatch[3] || '').trim();
    if (title) {
      return {
        type: 'delete_task',
        title,
      };
    }
  }

  return null;
}

function normalizeAction(action) {
  if (!action || !action.type || !action.title) {
    return null;
  }

  if (action.type === 'add_task') {
    return {
      type: 'add_task',
      title: action.title.trim(),
      priority: ['low', 'medium', 'high'].includes(action.priority)
        ? action.priority
        : 'medium',
    };
  }

  if (action.type === 'delete_task') {
    return {
      type: 'delete_task',
      title: action.title.trim(),
    };
  }

  return null;
}

export async function POST(request) {
  let body = {};

  try {
    body = await request.json();
    const { message, tasks, emotion, behaviorPatterns, userProfile } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      logger.warn('MISTRAL_API_KEY not set, falling back to local AI');
      const fallback = localGenerateSuggestion(tasks || [], emotion || '');
      return NextResponse.json({
        message: fallback.message,
        suggestion: fallback.task?.title || fallback.message,
        action: extractTaskAction(message),
      });
    }

    logger.ai('Using Mistral AI for chat');

    const last5Tasks = (tasks || []).slice(0, 5).map(task => ({
      title: task.title,
      priority: task.priority,
      completed: task.completed,
    }));

    const behaviorContext = behaviorPatterns ? getBehaviorContext(behaviorPatterns) : '';
    
    // Add user profile context if available
    let profileContext = '';
    if (userProfile) {
      const { name, full_name, age, designation, work_role, bio, ai_context, ai_memory_summary, productivity_score, peak_productivity_time, work_style } = userProfile;
      const displayName = full_name || name || 'User';
      profileContext = `
User profile:
- Name: ${displayName}
- Age: ${age || 'not set'}
- Designation: ${designation || 'not set'}
- Work Role: ${work_role || 'not set'}
- Bio: ${bio || 'not set'}
- Productivity score: ${productivity_score || 50}/100
- Peak productivity time: ${peak_productivity_time || 'not set'}
- Work style: ${work_style || 'not set'}
- AI memory: ${ai_memory_summary || 'No memory available'}
- AI context: ${ai_context ? JSON.stringify(ai_context) : '{}'}
`;
    }

    const context = `
${profileContext}
Current emotion: ${emotion || 'not set'}
Recent tasks: ${JSON.stringify(last5Tasks, null, 2)}
User message: ${message}
${behaviorContext}
`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: context,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mistral API error:', error);
      throw new Error('Mistral API request failed');
    }

    const data = await response.json();
    const aiContent = JSON.parse(data.choices[0].message.content);

    // Parse action from message if not explicitly provided
    let action = normalizeAction(aiContent.action);
    if (!action) {
      action = extractTaskAction(aiContent.message) || extractTaskAction(message);
    }

    return NextResponse.json({
      message: aiContent.message,
      suggestion: aiContent.suggestion,
      action: action || null,
    });

  } catch (error) {
    console.error('AI API error:', error);

    const fallback = localGenerateSuggestion(body.tasks || [], body.emotion || '');
    
    return NextResponse.json({
      message: fallback.message,
      suggestion: fallback.task?.title || fallback.message,
      action: extractTaskAction(body.message),
    });
  }
}
