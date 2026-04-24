export const getSuggestions = (mood) => {
  const suggestions = {
    stressed: [
      { title: "Take a short break", priority: "low" },
      { title: "Complete a small pending task", priority: "medium" },
    ],
    calm: [
      { title: "Plan your day", priority: "low" },
      { title: "Learn something new", priority: "medium" },
    ],
    focused: [
      { title: "Work on high priority task", priority: "high" },
      { title: "Finish pending important work", priority: "high" },
    ],
    happy: [
      { title: "Share your positive energy", priority: "low" },
      { title: "Tackle a challenging task", priority: "medium" },
    ],
    sad: [
      { title: "Take care of yourself", priority: "low" },
      { title: "Do something comforting", priority: "low" },
    ],
    angry: [
      { title: "Take a deep breath", priority: "low" },
      { title: "Step away and cool down", priority: "low" },
    ],
    fearful: [
      { title: "Face one small fear", priority: "medium" },
      { title: "Practice grounding techniques", priority: "low" },
    ],
    disgusted: [
      { title: "Clean your environment", priority: "low" },
      { title: "Focus on something pleasant", priority: "low" },
    ],
    surprised: [
      { title: "Embrace the unexpected", priority: "low" },
      { title: "Document what happened", priority: "low" },
    ],
    neutral: [
      { title: "Set a new goal", priority: "medium" },
      { title: "Review your progress", priority: "low" },
    ],
  };

  // Return suggestions for the mood, or fallback to calm suggestions
  return suggestions[mood] || suggestions["calm"];
};

export const generateSuggestion = (tasks, emotion, behaviorPatterns = null) => {
  if (!tasks || tasks.length === 0) {
    return {
      message: "No tasks available. Add some tasks to get personalized suggestions!",
      action: "add_task",
      priority: "high",
    };
  }

  const incompleteTasks = tasks.filter((task) => !task.completed);

  if (incompleteTasks.length === 0) {
    return {
      message: "All tasks completed! Great job! Take a break or add new tasks.",
      action: "celebrate",
      priority: "low",
    };
  }

  const estimateTaskComplexity = (task) => {
    const words = task.title.split(' ').length;
    if (words <= 3) return 'simple';
    if (words <= 6) return 'moderate';
    return 'complex';
  };

  const getTaskCountByPriority = () => {
    return {
      high: incompleteTasks.filter(t => t.priority === 'high').length,
      medium: incompleteTasks.filter(t => t.priority === 'medium').length,
      low: incompleteTasks.filter(t => t.priority === 'low').length,
    };
  };

  // Map backend emotions to mood categories
  const mapEmotionToMood = (emotion) => {
    const moodMap = {
      'stressed': 'stressed',
      'angry': 'stressed',
      'fearful': 'stressed',
      'disgusted': 'stressed',
      'sad': 'stressed',
      'calm': 'calm',
      'neutral': 'calm',
      'happy': 'calm',
      'focused': 'focused',
      'surprised': 'calm',
      'no_face': 'calm',
      'model_missing': 'calm',
    };
    return moodMap[emotion] || 'calm';
  };

  // Apply behavior-based personalization
  const getCurrentTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  };

  const currentTimeOfDay = getCurrentTimeOfDay();
  const isPeakTime = behaviorPatterns?.peakProductivityTime === currentTimeOfDay;
  const isHighStressTime = behaviorPatterns?.highStressTime === currentTimeOfDay;
  const strugglesWhenStressed = behaviorPatterns?.stressImpact > 30;
  const prefersShortTasks = behaviorPatterns?.workStyle === 'Quick bursts';
  const delaysHighPriority = behaviorPatterns?.weakAreas?.includes('Delays high priority tasks');

  const mood = mapEmotionToMood(emotion);

  switch (mood) {
    case 'stressed':
      // Time-aware stressed suggestions with behavior patterns
      if (currentTimeOfDay === 'night') {
        return {
          message: "It's late and you're stressed. Consider getting some rest - tasks can wait until tomorrow.",
          action: "rest",
          priority: "low",
          emotion: "stressed",
        };
      }

      if (currentTimeOfDay === 'afternoon') {
        const simpleTasks = incompleteTasks.filter(task => estimateTaskComplexity(task) === 'simple');
        if (simpleTasks.length > 0) {
          return {
            message: `Afternoon stress? Take a short break, then try this small task: "${simpleTasks[0].title}"`,
            action: "break_and_task",
            task: simpleTasks[0],
            priority: "low",
            emotion: "stressed",
          };
        }
        return {
          message: "Afternoon slump? Take a 5-minute break to recharge before continuing.",
          action: "break",
          priority: "low",
          emotion: "stressed",
        };
      }

      // Behavior-aware: if user always stressed at night, suggest lighter tasks
      if (behaviorPatterns?.highStressTime === 'night' && currentTimeOfDay === 'evening') {
        const simpleTasks = incompleteTasks.filter(task => estimateTaskComplexity(task) === 'simple');
        if (simpleTasks.length > 0) {
          return {
            message: `Based on your patterns, you tend to get stressed at night. Let's wrap up early with: "${simpleTasks[0].title}"`,
            action: "early_wrap",
            task: simpleTasks[0],
            priority: "low",
            emotion: "stressed",
          };
        }
      }

      // Morning stressed - suggest small task
      if (strugglesWhenStressed || prefersShortTasks) {
        const simpleTasks = incompleteTasks.filter(task => estimateTaskComplexity(task) === 'simple');
        const targetTask = simpleTasks.length > 0
          ? simpleTasks[0]
          : incompleteTasks.reduce((prev, current) =>
              prev.title.length < current.title.length ? prev : current
            );

        return {
          message: `Based on your patterns, you do better with small tasks when stressed. Try: "${targetTask.title}"`,
          action: "small_task",
          task: targetTask,
          priority: "low",
          emotion: "stressed",
        };
      }

      const simpleTasks = incompleteTasks.filter(task => estimateTaskComplexity(task) === 'simple');
      const targetTask = simpleTasks.length > 0
        ? simpleTasks[0]
        : incompleteTasks.reduce((prev, current) =>
            prev.title.length < current.title.length ? prev : current
          );

      const stressedMessages = [
        `You're stressed. Let's start small: "${targetTask.title}"`,
        `Feeling overwhelmed? Try this quick win: "${targetTask.title}"`,
        `Take it easy. Start with: "${targetTask.title}"`,
      ];

      return {
        message: stressedMessages[Math.floor(Math.random() * stressedMessages.length)],
        action: "small_task",
        task: targetTask,
        priority: "low",
        emotion: "stressed",
      };

    case 'focused':
      // Time-aware focused suggestions with behavior patterns
      if (currentTimeOfDay === 'night') {
        const highPriorityTasks = incompleteTasks.filter((task) => task.priority === 'high');
        if (highPriorityTasks.length > 0) {
          return {
            message: `Working late? Wrap up with this important task: "${highPriorityTasks[0].title}"`,
            action: "wrap_up",
            task: highPriorityTasks[0],
            priority: "high",
            emotion: "focused",
          };
        }
        return {
          message: "Late night focus? Consider wrapping up and getting some rest.",
          action: "rest",
          priority: "low",
          emotion: "focused",
        };
      }

      if (currentTimeOfDay === 'morning') {
        // If user prefers short tasks, suggest moderate tasks instead of complex ones
        if (prefersShortTasks) {
          const moderateTasks = incompleteTasks.filter(task => estimateTaskComplexity(task) === 'moderate');
          const targetTask = moderateTasks.length > 0
            ? moderateTasks[0]
            : incompleteTasks[0];
          return {
            message: `Morning energy! Based on your preference for quick tasks, try: "${targetTask.title}"`,
            action: "quick_task",
            task: targetTask,
            priority: "high",
            emotion: "focused",
          };
        }

        const complexTasks = incompleteTasks.filter(task => estimateTaskComplexity(task) === 'complex');
        const deepWorkTask = complexTasks.length > 0
          ? complexTasks[0]
          : incompleteTasks.reduce((prev, current) =>
              prev.title.length > current.title.length ? prev : current
            );

        return {
          message: `Morning energy is perfect for deep work! Tackle this: "${deepWorkTask.title}"`,
          action: "deep_work",
          task: deepWorkTask,
          priority: "high",
          emotion: "focused",
        };
      }

      if (currentTimeOfDay === 'afternoon') {
        return {
          message: "Afternoon focus? Keep the momentum going with your current task.",
          action: "maintain_momentum",
          priority: "medium",
          emotion: "focused",
        };
      }

      // If it's peak productivity time, push for high priority tasks
      if (isPeakTime) {
        const highPriorityTasks = incompleteTasks.filter((task) => task.priority === 'high');

        if (highPriorityTasks.length > 0) {
          return {
            message: `It's your peak productivity time! Crush this high-priority task: "${highPriorityTasks[0].title}"`,
            action: "high_priority",
            task: highPriorityTasks[0],
            priority: "high",
            emotion: "focused",
          };
        }
      }

      // If user delays high priority tasks, break them into smaller steps
      if (delaysHighPriority) {
        const highPriorityTasks = incompleteTasks.filter((task) => task.priority === 'high');
        if (highPriorityTasks.length > 0) {
          return {
            message: `You tend to delay high priority tasks. Let's break this down: "${highPriorityTasks[0].title}" - start with just 5 minutes!`,
            action: "break_down",
            task: highPriorityTasks[0],
            priority: "high",
            emotion: "focused",
          };
        }
      }

      const highPriorityTasks = incompleteTasks.filter(
        (task) => task.priority === 'high'
      );

      if (highPriorityTasks.length > 0) {
        const focusedMessages = [
          `You're focused! Crush this high-priority task: "${highPriorityTasks[0].title}"`,
          `Ride the wave. Tackle: "${highPriorityTasks[0].title}"`,
          `You're in the zone. Go for: "${highPriorityTasks[0].title}"`,
        ];
        return {
          message: focusedMessages[Math.floor(Math.random() * focusedMessages.length)],
          action: "high_priority",
          task: highPriorityTasks[0],
          priority: "high",
          emotion: "focused",
        };
      }

      const focusedFallbackMessages = [
        "You're focused! Pick any task to maintain your momentum.",
        "Ride your focus - choose a task that excites you.",
        "Your focus is sharp - what do you want to accomplish?",
      ];
      return {
        message: focusedFallbackMessages[Math.floor(Math.random() * focusedFallbackMessages.length)],
        action: "any_task",
        priority: "medium",
        emotion: "focused",
      };

    case 'calm':
      // Time-aware calm suggestions with behavior patterns
      if (currentTimeOfDay === 'morning') {
        // If peak productivity is morning, suggest important tasks even when calm
        if (isPeakTime) {
          const highPriorityTasks = incompleteTasks.filter((task) => task.priority === 'high');
          if (highPriorityTasks.length > 0) {
            return {
              message: `It's your peak time! Even when calm, you're most productive with: "${highPriorityTasks[0].title}"`,
              action: "high_priority",
              task: highPriorityTasks[0],
              priority: "high",
              emotion: "calm",
            };
          }
        }

        const mediumPriorityTasks = incompleteTasks.filter((task) => task.priority === 'medium');
        if (mediumPriorityTasks.length > 0) {
          return {
            message: `Morning calm is perfect for planning. Start with: "${mediumPriorityTasks[0].title}"`,
            action: "plan_task",
            task: mediumPriorityTasks[0],
            priority: "medium",
            emotion: "calm",
          };
        }
      }

      if (currentTimeOfDay === 'evening') {
        const lowPriorityTasks = incompleteTasks.filter((task) => task.priority === 'low');
        if (lowPriorityTasks.length > 0) {
          return {
            message: `Evening calm is great for light tasks. Try: "${lowPriorityTasks[0].title}"`,
            action: "light_task",
            task: lowPriorityTasks[0],
            priority: "low",
            emotion: "calm",
          };
        }
      }

      // If user is most productive when calm, suggest important tasks
      if (behaviorPatterns?.productivityByEmotion?.calm > behaviorPatterns?.productivityByEmotion?.focused) {
        const highPriorityTasks = incompleteTasks.filter((task) => task.priority === 'high');
        if (highPriorityTasks.length > 0) {
          return {
            message: `You're most productive when calm. Perfect time for: "${highPriorityTasks[0].title}"`,
            action: "high_priority",
            task: highPriorityTasks[0],
            priority: "high",
            emotion: "calm",
          };
        }
      }

      // If it's high stress time and user is calm, warn them to prepare
      if (isHighStressTime) {
        return {
          message: `You're calm now, but ${currentTimeOfDay} tends to be stressful for you. Use this peaceful moment to plan ahead.`,
          action: "prepare",
          priority: "medium",
          emotion: "calm",
        };
      }

      const priorityCount = getTaskCountByPriority();
      let calmTask;
      let calmAction;

      if (priorityCount.high > 0) {
        calmTask = incompleteTasks.find(t => t.priority === 'high');
        calmAction = "plan_high";
      } else if (priorityCount.medium > 0) {
        calmTask = incompleteTasks.find(t => t.priority === 'medium');
        calmAction = "plan_task";
      } else {
        calmTask = incompleteTasks[0];
        calmAction = "any_task";
      }

      const calmMessages = calmTask
        ? [
            `You're calm. Perfect time to plan: "${calmTask.title}"`,
            `Clear mind? Great for organizing: "${calmTask.title}"`,
            `Use your calm state to tackle: "${calmTask.title}"`,
          ]
        : [
            "You're calm. Great time for learning or planning tasks.",
            "Peaceful moment - consider learning something new.",
            "Your calm state is perfect for strategic thinking.",
          ];

      return {
        message: calmMessages[Math.floor(Math.random() * calmMessages.length)],
        action: calmAction,
        task: calmTask,
        priority: "medium",
        emotion: "calm",
      };

    default:
      return {
        message: "Set your emotion to get personalized task suggestions.",
        action: "set_emotion",
        priority: "medium",
        emotion: "neutral",
      };
  }
};

export const getEmotionColor = (emotion) => {
  switch (emotion) {
    case 'stressed':
      return 'neon-red';
    case 'calm':
      return 'neon-blue';
    case 'focused':
      return 'neon-cyan';
    default:
      return 'neon-purple';
  }
};

export const getEmotionGlow = (emotion) => {
  switch (emotion) {
    case 'stressed':
      return 'glow-stressed';
    case 'calm':
      return 'glow-calm';
    case 'focused':
      return 'glow-focused';
    default:
      return '';
  }
};
