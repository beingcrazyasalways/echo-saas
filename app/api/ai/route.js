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

You can add or delete tasks for the user. When the user asks to add a task, you MUST include the action in your JSON response with the action field. The action format is: { "type": "add_task", "title": "task title", "priority": "low|medium|high" }. When the user asks to delete a task, use: { "type": "delete_task", "title": "task title" }.

IMPORTANT: Always include the action field in your JSON when the user requests to add or delete a task. Do not just mention it in the message - it must be in the action field.

Respond in JSON format with this structure:
{
  "message": "short response",
  "suggestion": "actionable next step or personalized advice",
  "action": null | { "type": "add_task" | "delete_task", "title": "task title", "priority": "low|medium|high" }
}`;

export async function POST(request) {
  try {
    const { message, tasks, emotion, behaviorPatterns } = await request.json();

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
      });
    }

    logger.ai('Using Mistral AI for chat');

    const last5Tasks = (tasks || []).slice(0, 5).map(task => ({
      title: task.title,
      priority: task.priority,
      completed: task.completed,
    }));

    const behaviorContext = behaviorPatterns ? getBehaviorContext(behaviorPatterns) : '';

    const context = `
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
    let action = aiContent.action;
    if (!action) {
      const message = aiContent.message.toLowerCase();
      
      // Check for add task requests in natural language
      if (message.includes('add') && (message.includes('task') || message.includes('as a task'))) {
        // Extract task title and priority from natural language
        let title = '';
        let priority = 'medium';
        
        // Try to extract title after "add" or "add task"
        const addMatch = message.match(/add\s+(?:task\s+)?(.+?)(?:\s+(?:with|as)\s+(?:priority\s+)?(\w+))?$/i);
        if (addMatch) {
          title = addMatch[1].trim();
          priority = addMatch[2] || 'medium';
          
          // Clean up common phrases
          title = title.replace(/\s+(as a task|as task)$/i, '').trim();
          title = title.replace(/\s+(with priority|priority)$/i, '').trim();
        }
        
        if (title) {
          action = {
            type: 'add_task',
            title: title,
            priority: priority
          };
        }
      } else if (message.includes('delete') && message.includes('task')) {
        const match = message.match(/delete\s+(?:task\s+)?(.+)/i);
        if (match) {
          action = {
            type: 'delete_task',
            title: match[1].trim()
          };
        }
      }
    }

    return NextResponse.json({
      message: aiContent.message,
      suggestion: aiContent.suggestion,
      action: action || null,
    });

  } catch (error) {
    console.error('AI API error:', error);
    
    const { message, tasks, emotion } = await request.json().catch(() => ({}));
    const fallback = localGenerateSuggestion(tasks || [], emotion || '');
    
    return NextResponse.json({
      message: fallback.message,
      suggestion: fallback.task?.title || fallback.message,
    });
  }
}
