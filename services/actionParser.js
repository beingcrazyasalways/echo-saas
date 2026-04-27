/**
 * Action Parser Service
 * Detects commands from AI responses or user input
 */

/**
 * Parse input to detect actions
 * @param {string} input - Text to parse (AI response or user input)
 * @returns {Object|null} Detected action or null
 */
export function parseAction(input) {
  const text = input.toLowerCase();

  // Emotion change detection
  const emotionMatch = text.match(/(?:set|change|make|update).*(?:my|the).*(?:mood|emotion|feeling).*(?:to|as)\s+(\w+)/i);
  if (emotionMatch) {
    return {
      type: 'SET_EMOTION',
      value: emotionMatch[1]
    };
  }

  // Task addition detection
  const taskMatch = text.match(/(?:add|create|new).*(?:task|todo|reminder)[:\s]+(.+)/i);
  if (taskMatch) {
    return {
      type: 'ADD_TASK',
      task: {
        title: taskMatch[1].trim(),
        priority: 'medium'
      }
    };
  }

  // Task with deadline detection
  const taskDeadlineMatch = text.match(/(?:add|create).*(?:task|todo)[:\s]+(.+?)(?:by|due|deadline)[:\s]+(.+)/i);
  if (taskDeadlineMatch) {
    return {
      type: 'ADD_TASK',
      task: {
        title: taskDeadlineMatch[1].trim(),
        deadline: taskDeadlineMatch[2].trim(),
        priority: 'medium'
      }
    };
  }

  // Task completion detection
  const completeMatch = text.match(/(?:complete|finish|done|mark).*(?:task|todo)[:\s]+(.+)/i);
  if (completeMatch) {
    return {
      type: 'COMPLETE_TASK',
      taskTitle: completeMatch[1].trim()
    };
  }

  // Task deletion detection
  const deleteMatch = text.match(/(?:delete|remove).*(?:task|todo)[:\s]+(.+)/i);
  if (deleteMatch) {
    return {
      type: 'DELETE_TASK',
      taskTitle: deleteMatch[1].trim()
    };
  }

  // Focus mode detection
  if (text.includes('focus mode') || text.includes('enter focus')) {
    return {
      type: 'SET_FOCUS_MODE',
      value: true
    };
  }

  if (text.includes('exit focus') || text.includes('stop focus')) {
    return {
      type: 'SET_FOCUS_MODE',
      value: false
    };
  }

  return null;
}

/**
 * Parse AI response for structured actions
 * @param {string} aiResponse - AI response text
 * @returns {Array} Array of detected actions
 */
export function parseAIResponse(aiResponse) {
  const actions = [];
  
  // Try to parse JSON if present
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Handle structured AI responses
      if (parsed.summary) {
        parsed.summary.forEach(item => {
          if (item.action === 'User Emotion Update') {
            actions.push({
              type: 'SET_EMOTION',
              value: item.details.new_emotion
            });
          }
          if (item.action === 'Task Assignment') {
            actions.push({
              type: 'ADD_TASK',
              task: {
                title: item.details.task,
                deadline: item.details.schedule?.date,
                priority: 'medium'
              }
            });
          }
        });
      }
    }
  } catch (e) {
    // JSON parsing failed, fall back to text parsing
  }

  // Also do text-based parsing as fallback
  const textAction = parseAction(aiResponse);
  if (textAction) {
    actions.push(textAction);
  }

  return actions;
}
