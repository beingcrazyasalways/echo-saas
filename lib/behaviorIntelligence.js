import { supabase } from './supabaseClient';

// Behavior Tracking Functions

export async function logTaskBehavior(userId, taskId, priority, emotion, durationMinutes) {
  const hour = new Date().getHours();
  let timeOfDay;
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';

  const { data, error } = await supabase
    .from('user_behavior')
    .insert([
      {
        user_id: userId,
        task_id: taskId,
        type: 'task',
        emotion,
        task_priority: priority,
        completed_at: new Date().toISOString(),
        time_of_day: timeOfDay,
        task_duration_minutes: durationMinutes,
        metadata: {
          priority,
          duration: durationMinutes,
          emotion_at_completion: emotion
        }
      }
    ])
    .select();

  return { data, error };
}

export async function logEmotionBehavior(userId, emotion, stressLevel, confidence) {
  const hour = new Date().getHours();
  let timeOfDay;
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';

  const { data, error } = await supabase
    .from('user_behavior')
    .insert([
      {
        user_id: userId,
        type: 'emotion',
        emotion,
        completed_at: new Date().toISOString(),
        time_of_day: timeOfDay,
        metadata: {
          stress_level: stressLevel,
          confidence
        }
      }
    ])
    .select();

  return { data, error };
}

export async function logSessionBehavior(userId, durationMinutes) {
  const hour = new Date().getHours();
  let timeOfDay;
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';

  const { data, error } = await supabase
    .from('user_behavior')
    .insert([
      {
        user_id: userId,
        type: 'session',
        completed_at: new Date().toISOString(),
        time_of_day: timeOfDay,
        session_duration_minutes: durationMinutes,
        metadata: {
          session_duration: durationMinutes
        }
      }
    ])
    .select();

  return { data, error };
}

// Pattern Detection Logic

export async function analyzeBehaviorPatterns(userId) {
  const { data: behaviorData, error } = await supabase
    .from('user_behavior')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !behaviorData || behaviorData.length === 0) {
    return {
      peakProductivityTime: 'morning',
      highStressTime: 'evening',
      workStyle: 'Balanced',
      weakAreas: [],
      productivityByEmotion: { stressed: 50, calm: 50, focused: 50 },
      stressImpact: 30
    };
  }

  // Analyze productivity by time of day
  const productivityByTime = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const tasksByTime = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  behaviorData.forEach(log => {
    if (log.type === 'task' && log.time_of_day) {
      tasksByTime[log.time_of_day]++;
      if (log.emotion === 'focused') {
        productivityByTime[log.time_of_day]++;
      }
    }
  });

  // Find peak productivity time
  const peakProductivityTime = Object.keys(productivityByTime).reduce((a, b) =>
    productivityByTime[a] > productivityByTime[b] ? a : b
  );

  // Analyze stress by time of day
  const stressByTime = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const emotionCountsByTime = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  behaviorData.forEach(log => {
    if (log.type === 'emotion' && log.time_of_day) {
      emotionCountsByTime[log.time_of_day]++;
      if (log.emotion === 'stressed') {
        stressByTime[log.time_of_day]++;
      }
    }
  });

  // Find high stress time
  const highStressTime = Object.keys(stressByTime).reduce((a, b) =>
    stressByTime[a] > stressByTime[b] ? a : b
  );

  // Analyze work style
  const taskDurations = behaviorData
    .filter(log => log.type === 'task' && log.task_duration_minutes)
    .map(log => log.task_duration_minutes);

  let workStyle = 'Balanced';
  if (taskDurations.length > 0) {
    const avgDuration = taskDurations.reduce((a, b) => a + b, 0) / taskDurations.length;
    if (avgDuration < 15) workStyle = 'Quick bursts';
    else if (avgDuration > 60) workStyle = 'Deep work';
    else workStyle = 'Balanced';
  }

  // Analyze weak areas
  const weakAreas = [];
  const highPriorityTasks = behaviorData.filter(log => 
    log.type === 'task' && log.task_priority === 'high'
  );
  
  const delayedHighPriority = highPriorityTasks.filter(log => {
    if (log.task_duration_minutes && log.task_duration_minutes > 60) return true;
    return false;
  });

  if (delayedHighPriority.length > highPriorityTasks.length * 0.5) {
    weakAreas.push('Delays high priority tasks');
  }

  // Analyze productivity by emotion
  const productivityByEmotion = { stressed: 50, calm: 50, focused: 50 };
  const tasksByEmotion = { stressed: [], calm: [], focused: [] };

  behaviorData.forEach(log => {
    if (log.type === 'task' && log.emotion) {
      tasksByEmotion[log.emotion].push(log);
    }
  });

  Object.keys(tasksByEmotion).forEach(emotion => {
    if (tasksByEmotion[emotion].length > 0) {
      const completedTasks = tasksByEmotion[emotion].filter(log => log.completed_at);
      productivityByEmotion[emotion] = Math.min(100, (completedTasks.length / tasksByEmotion[emotion].length) * 100);
    }
  });

  // Calculate stress impact
  const stressedTasks = tasksByEmotion.stressed.length;
  const totalTasks = Object.values(tasksByEmotion).reduce((acc, arr) => acc + arr.length, 0);
  const stressImpact = totalTasks > 0 ? (stressedTasks / totalTasks) * 100 : 30;

  return {
    peakProductivityTime,
    highStressTime,
    workStyle,
    weakAreas,
    productivityByEmotion,
    stressImpact
  };
}

// User Profile Management

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { data, error };
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('user_profile')
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString()
    })
    .select();

  return { data, error };
}

// Productivity Scoring

export async function calculateProductivityScore(userId) {
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);

  if (tasksError || !tasks) return 50;

  const completedTasks = tasks.filter(t => t.completed);
  const totalTasks = tasks.length;

  if (totalTasks === 0) return 50;

  const completionRate = (completedTasks.length / totalTasks) * 100;

  // Get recent behavior to calculate stress impact
  const { data: behaviorData } = await supabase
    .from('user_behavior')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  let stressImpact = 30;
  if (behaviorData && behaviorData.length > 0) {
    const stressedLogs = behaviorData.filter(log => log.emotion === 'stressed');
    stressImpact = (stressedLogs.length / behaviorData.length) * 100;
  }

  // Calculate score based on completion rate and stress
  const score = Math.round((completionRate * 0.7) + ((100 - stressImpact) * 0.3));

  return Math.min(100, Math.max(0, score));
}

// Daily Summary Generation

export async function generateDailySummary(userId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  const { data: emotions, error: emotionsError } = await supabase
    .from('emotions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  const { data: behaviorData } = await supabase
    .from('user_behavior')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  if (tasksError && emotionsError) return null;

  const completedTasksToday = tasks ? tasks.filter(t => t.completed).length : 0;
  const totalTasksToday = tasks ? tasks.length : 0;

  // Analyze emotion distribution
  const emotionCounts = { stressed: 0, calm: 0, focused: 0 };
  if (emotions) {
    emotions.forEach(e => {
      if (emotionCounts[e.mood] !== undefined) {
        emotionCounts[e.mood]++;
      }
    });
  }

  const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) =>
    emotionCounts[a] > emotionCounts[b] ? a : b
  );

  // Analyze productivity by time
  const tasksByTime = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  if (behaviorData) {
    behaviorData.forEach(log => {
      if (log.type === 'task' && log.time_of_day) {
        tasksByTime[log.time_of_day]++;
      }
    });
  }

  const peakTime = Object.keys(tasksByTime).reduce((a, b) =>
    tasksByTime[a] > tasksByTime[b] ? a : b
  );

  // Generate summary
  let summary = `Today, you completed ${completedTasksToday} of ${totalTasksToday} tasks. `;
  
  if (dominantEmotion === 'stressed') {
    summary += `You showed signs of stress throughout the day. `;
  } else if (dominantEmotion === 'calm') {
    summary += `You maintained a calm state most of the day. `;
  } else if (dominantEmotion === 'focused') {
    summary += `You were focused and productive. `;
  }

  if (peakTime && tasksByTime[peakTime] > 0) {
    summary += `Your peak productivity was in the ${peakTime}. `;
  }

  if (emotionCounts.stressed > emotionCounts.calm + emotionCounts.focused) {
    summary += `Consider taking breaks to reduce stress levels.`;
  }

  return summary;
}

// Update user profile with daily summary
export async function updateDailySummary(userId) {
  const summary = await generateDailySummary(userId);
  if (!summary) return null;

  const { data: profile } = await getUserProfile(userId);
  const today = new Date().toISOString().split('T')[0];

  // Check if we should generate a new summary (once per day)
  if (profile && profile.last_summary_date === today) {
    return profile.daily_summary;
  }

  const { data, error } = await updateUserProfile(userId, {
    daily_summary: summary,
    last_summary_date: today
  });

  return { data, error };
}

// Daily Metrics Tracking
export async function getTodayMetrics(userId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  // Get tasks completed today
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  // Get emotion logs today
  const { data: emotions } = await supabase
    .from('emotions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  // Get behavior logs today for focus time calculation
  const { data: behaviors } = await supabase
    .from('user_behavior')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  // Calculate focus time (sum of session durations)
  const focusTimeMinutes = behaviors?.reduce((acc, log) => {
    return acc + (log.session_duration_minutes || 0);
  }, 0) || 0;

  // Get dominant mood today
  const emotionCounts = { stressed: 0, calm: 0, focused: 0 };
  if (emotions) {
    emotions.forEach(e => {
      if (emotionCounts[e.mood] !== undefined) {
        emotionCounts[e.mood]++;
      }
    });
  }

  const dominantMood = Object.keys(emotionCounts).reduce((a, b) =>
    emotionCounts[a] > emotionCounts[b] ? a : b
  );

  return {
    tasksCompleted: tasks?.length || 0,
    emotionLogs: emotions?.length || 0,
    focusTimeMinutes,
    dominantMood,
    date: today.toISOString().split('T')[0]
  };
}

// Streak System
export async function calculateStreak(userId) {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('completed, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!tasks || tasks.length === 0) return 0;

  // Group tasks by date
  const tasksByDate = {};
  tasks.forEach(task => {
    const date = new Date(task.created_at).toISOString().split('T')[0];
    if (!tasksByDate[date]) {
      tasksByDate[date] = { total: 0, completed: 0 };
    }
    tasksByDate[date].total++;
    if (task.completed) {
      tasksByDate[date].completed++;
    }
  });

  // Calculate streak
  let streak = 0;
  let currentDate = new Date();
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayData = tasksByDate[dateStr];
    
    if (dayData && dayData.completed > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (dateStr === new Date().toISOString().split('T')[0]) {
      // Today hasn't had any completed tasks yet, check yesterday
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// XP System
export async function calculateXP(userId) {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('completed, priority')
    .eq('user_id', userId);

  if (!tasks || tasks.length === 0) return 0;

  let totalXP = 0;
  tasks.forEach(task => {
    if (task.completed) {
      const priorityXP = {
        low: 10,
        medium: 20,
        high: 30
      };
      totalXP += priorityXP[task.priority] || 20;
    }
  });

  return totalXP;
}
