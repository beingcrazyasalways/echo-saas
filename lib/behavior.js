import { supabase } from './supabaseClient';

// Get time of day from timestamp
const getTimeOfDay = (date = new Date()) => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
};

// Log behavior when task is completed
export const logBehavior = async (userId, taskId, emotion, taskDurationMinutes = null) => {
  try {
    const timeOfDay = getTimeOfDay();
    const { data, error } = await supabase
      .from('user_behavior')
      .insert({
        user_id: userId,
        task_id: taskId,
        emotion,
        time_of_day: timeOfDay,
        task_duration_minutes: taskDurationMinutes,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error logging behavior:', error);
    return { data: null, error };
  }
};

// Fetch user behavior data
export const fetchUserBehavior = async (userId, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('user_behavior')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user behavior:', error);
    return { data: null, error };
  }
};

// Analyze patterns in user behavior
export const analyzeBehaviorPatterns = (behaviorData) => {
  if (!behaviorData || behaviorData.length === 0) {
    return {
      productivityByEmotion: {},
      productivityByTimeOfDay: {},
      averageTaskDuration: null,
      peakProductivityTime: null,
      stressImpact: null,
      insights: [],
    };
  }

  // Count completions by emotion
  const emotionCounts = { stressed: 0, calm: 0, focused: 0 };
  behaviorData.forEach(b => {
    if (emotionCounts[b.emotion] !== undefined) {
      emotionCounts[b.emotion]++;
    }
  });

  // Count completions by time of day
  const timeOfDayCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  behaviorData.forEach(b => {
    if (timeOfDayCounts[b.time_of_day] !== undefined) {
      timeOfDayCounts[b.time_of_day]++;
    }
  });

  // Calculate average task duration
  const durations = behaviorData
    .filter(b => b.task_duration_minutes !== null)
    .map(b => b.task_duration_minutes);
  const averageTaskDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  // Find peak productivity time
  const peakTime = Object.entries(timeOfDayCounts)
    .sort((a, b) => b[1] - a[1])[0];

  // Calculate stress impact (completion rate when stressed vs others)
  const stressedCount = emotionCounts.stressed || 0;
  const otherCount = (emotionCounts.calm || 0) + (emotionCounts.focused || 0);
  const stressImpact = otherCount > 0
    ? Math.round((stressedCount / (stressedCount + otherCount)) * 100)
    : null;

  // Generate insights
  const insights = [];
  const total = behaviorData.length;

  // Productivity by emotion insight
  const maxEmotion = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0];
  if (maxEmotion) {
    const percentage = Math.round((maxEmotion[1] / total) * 100);
    insights.push(`You complete ${percentage}% of tasks when ${maxEmotion[0]}.`);
  }

  // Peak productivity time insight
  if (peakTime && peakTime[1] > 0) {
    const percentage = Math.round((peakTime[1] / total) * 100);
    insights.push(`Your peak productivity is in the ${peakTime[0]} (${percentage}% of completions).`);
  }

  // Stress impact insight
  if (stressImpact !== null && stressImpact > 30) {
    insights.push(`You complete ${stressImpact}% of tasks when stressed. Consider stress management.`);
  } else if (stressImpact !== null && stressImpact < 20) {
    insights.push(`You rarely complete tasks when stressed (${stressImpact}%). Good stress management!`);
  }

  // Task duration insight
  if (averageTaskDuration) {
    if (averageTaskDuration < 30) {
      insights.push(`You complete tasks quickly (avg ${averageTaskDuration} min). You're efficient!`);
    } else if (averageTaskDuration > 60) {
      insights.push(`You take time with tasks (avg ${averageTaskDuration} min). Consider breaking them down.`);
    }
  }

  return {
    productivityByEmotion: emotionCounts,
    productivityByTimeOfDay: timeOfDayCounts,
    averageTaskDuration,
    peakProductivityTime: peakTime ? peakTime[0] : null,
    stressImpact,
    insights,
  };
};

// Get behavior context for AI
export const getBehaviorContext = (patterns) => {
  if (!patterns || !patterns.insights || patterns.insights.length === 0) {
    return '';
  }

  let context = 'User behavior patterns:\n';
  patterns.insights.forEach(insight => {
    context += `- ${insight}\n`;
  });

  if (patterns.peakProductivityTime) {
    context += `- Peak productivity time: ${patterns.peakProductivityTime}\n`;
  }

  if (patterns.stressImpact !== null) {
    if (patterns.stressImpact > 30) {
      context += '- User struggles with tasks when stressed\n';
    } else {
      context += '- User manages stress well\n';
    }
  }

  return context;
};
