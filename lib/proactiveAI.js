import { generateSuggestion } from './aiSuggestions';

export function prioritizeTasks(tasks) {
  if (!tasks || tasks.length === 0) return [];

  const incompleteTasks = tasks.filter(task => !task.completed);
  
  const priorityScore = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return incompleteTasks.sort((a, b) => {
    const scoreA = priorityScore[a.priority] || 2;
    const scoreB = priorityScore[b.priority] || 2;
    return scoreB - scoreA;
  });
}

export function analyzeUserState(tasks, emotion, recentActivities = []) {
  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  
  const taskCount = {
    total: tasks.length,
    incomplete: incompleteTasks.length,
    completed: completedTasks.length,
  };

  const highPriorityCount = incompleteTasks.filter(t => t.priority === 'high').length;
  const mediumPriorityCount = incompleteTasks.filter(t => t.priority === 'medium').length;
  
  let urgency = 'low';
  if (highPriorityCount > 3) urgency = 'high';
  else if (highPriorityCount > 1 || taskCount.incomplete > 5) urgency = 'medium';

  const todayActivities = recentActivities.filter(a => {
    const activityDate = new Date(a.created_at);
    const today = new Date();
    return activityDate.toDateString() === today.toDateString();
  });

  const activityLevel = todayActivities.length > 10 ? 'high' : 
                       todayActivities.length > 5 ? 'medium' : 'low';

  return {
    taskCount,
    urgency,
    activityLevel,
    emotion,
    recommendation: generateContextualRecommendation(tasks, emotion, urgency),
  };
}

function generateContextualRecommendation(tasks, emotion, urgency) {
  const incompleteTasks = tasks.filter(t => !t.completed);
  
  if (incompleteTasks.length === 0) {
    return {
      message: "All tasks completed! Great work today.",
      action: "celebrate",
      priority: "low",
    };
  }

  if (emotion === 'stressed') {
    const simpleTasks = incompleteTasks.filter(t => t.title.split(' ').length <= 3);
    if (simpleTasks.length > 0) {
      return {
        message: "You're stressed. Let's start with something simple.",
        action: "small_task",
        task: simpleTasks[0],
        priority: "low",
      };
    }
  }

  if (urgency === 'high' && emotion === 'focused') {
    const highPriority = incompleteTasks.filter(t => t.priority === 'high');
    if (highPriority.length > 0) {
      return {
        message: "High priority tasks need attention. Let's tackle them.",
        action: "high_priority",
        task: highPriority[0],
        priority: "high",
      };
    }
  }

  if (emotion === 'calm') {
    return {
      message: "You're calm. Good time for planning or learning.",
      action: "plan",
      priority: "medium",
    };
  }

  const defaultSuggestion = generateSuggestion(tasks, emotion);
  return defaultSuggestion;
}

export function generateMicroNudge(tasks, emotion, completedToday = 0) {
  const nudges = [];

  if (completedToday >= 3) {
    nudges.push({
      message: "You're on a roll! Keep up the momentum.",
      type: "positive",
    });
  }

  if (emotion === 'stressed') {
    nudges.push({
      message: "Take a deep breath. Small steps forward.",
      type: "calming",
    });
  }

  if (emotion === 'focused' && tasks.filter(t => !t.completed).length > 0) {
    nudges.push({
      message: "You're in the zone. What's next?",
      type: "motivational",
    });
  }

  const incompleteCount = tasks.filter(t => !t.completed).length;
  if (incompleteCount === 1) {
    nudges.push({
      message: "One task left. You can do it!",
      type: "motivational",
    });
  }

  return nudges[Math.floor(Math.random() * nudges.length)] || null;
}

export async function generateDailyBriefing(tasks, emotion, recentActivities) {
  const prioritizedTasks = prioritizeTasks(tasks);
  const topTasks = prioritizedTasks.slice(0, 3);
  
  const state = analyzeUserState(tasks, emotion, recentActivities);
  
  const briefing = {
    greeting: getGreeting(),
    emotionInsight: getEmotionInsight(emotion),
    todayPlan: topTasks.map(t => t.title),
    priorityTask: topTasks[0]?.title || "No tasks",
    recommendation: state.recommendation.message,
    urgency: state.urgency,
    taskCount: state.taskCount.incomplete,
  };

  return briefing;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getEmotionInsight(emotion) {
  switch (emotion) {
    case 'stressed':
      return "You're feeling stressed today. Focus on small wins.";
    case 'focused':
      return "You're in a focused state. Great time for important tasks.";
    case 'calm':
      return "You're calm and centered. Perfect for planning.";
    default:
      return "How are you feeling today?";
  }
}

export function shouldTriggerFocusMode(tasks, emotion) {
  const incompleteTasks = tasks.filter(t => !t.completed);
  const highPriorityCount = incompleteTasks.filter(t => t.priority === 'high').length;
  
  // Only trigger if user is explicitly in focused state AND has multiple high-priority tasks
  // This prevents accidental blocking after AI actions
  return emotion === 'focused' && highPriorityCount >= 2;
}
