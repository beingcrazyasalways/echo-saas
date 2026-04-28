'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, signOut, getCurrentUser } from '@/lib/supabaseClient';
import { fetchTasks, addTask, toggleTask, deleteTask, updateTaskPriority } from '@/lib/tasks';
import { getLatestEmotion } from '@/lib/emotions';
import { generateSuggestion, getEmotionColor, getEmotionGlow as getAiEmotionGlow } from '@/lib/aiSuggestions';
import { getEmotionConfig, getEmotionDisplayName } from '@/lib/emotionConfig';
import { logActivity, fetchRecentActivities, getTodayActivities, getLastVisit } from '@/lib/activities';
import { prioritizeTasks, analyzeUserState, generateDailyBriefing, generateMicroNudge, shouldTriggerFocusMode } from '@/lib/proactiveAI';
import { analyzeBehaviorPatterns, getUserProfile, updateDailySummary, calculateProductivityScore, logTaskBehavior, logEmotionBehavior, logSessionBehavior, getTodayMetrics, calculateStreak, calculateXP } from '@/lib/behaviorIntelligence';
import { getUserProfile as fetchUserProfile, getPersonalizedGreeting } from '@/lib/userProfile';
import logger from '@/lib/logger';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import TaskList from '../../components/TaskList';
import SuggestionCard from '../../components/SuggestionCard';
import EmotionCard from '../../components/EmotionCard';
import RightPanel from '../../components/RightPanel';
import FloatingButton from '../../components/FloatingButton';
import ChatUI from '../../components/ChatUI';
import FocusMode from '../../components/FocusMode';
import MicroNudge from '../../components/MicroNudge';
import ProfilePanel from '../../components/ProfilePanel';
import { Plus, AlertCircle, Target, Zap, Camera, Flame, Calendar, Clock } from 'lucide-react';
import { useTimeContext } from '../../hooks/useTimeContext';
import { useEmotion } from '@/contexts/EmotionContext';

export default function DashboardPage() {
  const router = useRouter();
  const { dayOfWeek, formattedTime, sessionDuration, timeOfDay } = useTimeContext();
  const { currentEmotion, updateEmotion, tasks: globalTasks, addTask: globalAddTask, toggleTask: globalToggleTask, deleteTask: globalDeleteTask } = useEmotion();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [tasks, setTasks] = useState([]); // Keep for Supabase sync, will merge with global
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [chatSuggestion, setChatSuggestion] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const toggleChat = () => {
    const newState = !showChat;
    setShowChat(newState);
    logger.chat('Modal state changed:', { state: newState });
  };
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [dailyBriefing, setDailyBriefing] = useState(null);
  const [microNudge, setMicroNudge] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [prioritizedTasks, setPrioritizedTasks] = useState([]);
  const [latestEmotionData, setLatestEmotionData] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [behaviorPatterns, setBehaviorPatterns] = useState(null);
  const [productivityScore, setProductivityScore] = useState(50);
  const [todayMetrics, setTodayMetrics] = useState(null);
  const [automationAlert, setAutomationAlert] = useState(null);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [streak, setStreak] = useState(0);
  const [xp, setXP] = useState(0);
  const [taskFeedback, setTaskFeedback] = useState(null);
  const [addingTask, setAddingTask] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const setMessage = (value) => {
    if (!value) {
      setTaskFeedback(null);
      return;
    }

    const isError = value.toLowerCase().includes('fail');
    const cleanedMessage = value.replace(/[^\x20-\x7E]+/g, ' ').trim();
    setTaskFeedback({
      type: isError ? 'error' : 'success',
      message: cleanedMessage,
    });
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadTasks();
      loadEmotion();
      loadActivities();
      loadEmotionHistory();
      loadBehaviorPatterns();
      loadUserProfile();
      loadProductivityScore();
      loadTodayMetrics();
      loadStreak();
      loadXP();
      checkDailyBriefing();
      // Log session start behavior
      logSessionBehavior(user.id, 0);
    }
  }, [user]);

  useEffect(() => {
    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/login');
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user && tasks.length > 0) {
      checkDailyBriefing();
    }
  }, [user, tasks]);

  useEffect(() => {
    if (tasks.length > 0 || currentEmotion) {
      runProactiveAnalysis();
    }
  }, [tasks, currentEmotion]);

  useEffect(() => {
    if (currentEmotion) {
      // EmotionContext handles localStorage sync
    }
  }, [currentEmotion]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const savedEmotion = localStorage.getItem('currentEmotion');
        if (savedEmotion && savedEmotion !== currentEmotion) {
          updateEmotion(savedEmotion);
          loadEmotion();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentEmotion]);

  useEffect(() => {
    if (tasks.length > 0 || currentEmotion) {
      const newSuggestion = generateSuggestion(tasks, currentEmotion, behaviorPatterns);
      setSuggestion(newSuggestion);
    }
  }, [tasks, currentEmotion, behaviorPatterns]);

  // Auto-refresh AI suggestions every 15 seconds
  useEffect(() => {
    if (tasks.length > 0 || currentEmotion) {
      const interval = setInterval(() => {
        const newSuggestion = generateSuggestion(tasks, currentEmotion, behaviorPatterns);
        setSuggestion(newSuggestion);
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [tasks, currentEmotion, behaviorPatterns]);

  // Check for automation triggers
  useEffect(() => {
    const checkAutomationTriggers = () => {
      // Check for high stress
      if (currentEmotion === 'stressed' && latestEmotionData) {
        const stressScore = latestEmotionData.stress_score || latestEmotionData.stress_level || 0;
        if (stressScore > 70 && !automationAlert) {
          setAutomationAlert({
            type: 'stress',
            message: "You seem stressed. Take a 2-minute break?",
            action: 'break'
          });
        }
      }

      // Check for inactivity (30 minutes)
      const now = Date.now();
      const inactivityMinutes = (now - lastActivityTime) / 60000;
      if (inactivityMinutes > 30 && !automationAlert) {
        setAutomationAlert({
          type: 'inactivity',
          message: "Still there? Let's resume with one small task.",
          action: 'resume'
        });
      }

      // Check for many pending tasks
      const pendingTasks = tasks.filter(t => !t.completed);
      if (pendingTasks.length > 5 && !automationAlert) {
        const easiestTask = pendingTasks.sort((a, b) => {
          const priorityOrder = { low: 0, medium: 1, high: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })[0];
        setAutomationAlert({
          type: 'pending',
          message: `Start with: "${easiestTask.title}"`,
          action: 'task',
          task: easiestTask
        });
      }
    };

    const interval = setInterval(checkAutomationTriggers, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [currentEmotion, latestEmotionData, tasks, lastActivityTime, automationAlert]);

  const checkAuth = async () => {
    const { user: currentUser } = await getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    
    // Load user profile for personalization
    const profile = await fetchUserProfile(currentUser.id);
    setUserProfile(profile);
    
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      logger.error('[Auth] Logout error:', { error });
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };

  const loadTasks = async () => {
    if (!user) return;
    const { data } = await fetchTasks(user.id);
    setTasks(data || []);
  };

  const loadEmotion = async () => {
    if (!user) return;
    
    // Get manual emotion from localStorage or current state
    const manualEmotion = localStorage.getItem('currentEmotion') || currentEmotion || 'calm';
    
    // Fetch latest stored emotion from Supabase
    const { data } = await getLatestEmotion(user.id);
    const latestStoredEmotion = data?.mood || null;
    
    const newEmotion = latestStoredEmotion ?? manualEmotion ?? 'neutral';
    
    updateEmotion(newEmotion);
    
    if (data) {
      setLatestEmotionData(data);
    }
  };

  const loadEmotionHistory = async () => {
    if (!user) return;
    try {
      const { fetchEmotions } = await import('@/lib/emotions');
      const { data } = await fetchEmotions(user.id);
      setEmotionHistory(data || []);
    } catch (error) {
      console.error('Error loading emotion history:', error);
      setEmotionHistory([]);
    }
  };

  const loadBehaviorPatterns = async () => {
    if (!user) return;
    try {
      const patterns = await analyzeBehaviorPatterns(user.id);
      setBehaviorPatterns(patterns);
    } catch (error) {
      logger.error('Error loading behavior patterns:', { error });
      setBehaviorPatterns(null);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const { data } = await getUserProfile(user.id);
      setUserProfile(data);
    } catch (error) {
      logger.error('Error loading user profile:', { error });
      setUserProfile(null);
    }
  };

  const loadProductivityScore = async () => {
    if (!user) return;
    try {
      const score = await calculateProductivityScore(user.id);
      setProductivityScore(score);
    } catch (error) {
      logger.error('Error calculating productivity score:', { error });
      setProductivityScore(50);
    }
  };

  const loadTodayMetrics = async () => {
    if (!user) return;
    try {
      const metrics = await getTodayMetrics(user.id);
      setTodayMetrics(metrics);
    } catch (error) {
      logger.error('Error loading today metrics:', { error });
      setTodayMetrics(null);
    }
  };

  const loadStreak = async () => {
    if (!user) return;
    try {
      const streakCount = await calculateStreak(user.id);
      setStreak(streakCount);
    } catch (error) {
      logger.error('Error calculating streak:', { error });
      setStreak(0);
    }
  };

  const loadXP = async () => {
    if (!user) return;
    try {
      const xpCount = await calculateXP(user.id);
      setXP(xpCount);
    } catch (error) {
      logger.error('Error calculating XP:', { error });
      setXP(0);
    }
  };

  const loadActivities = async () => {
    if (!user) return;
    try {
      const { data } = await fetchRecentActivities(user.id, 20);
      setRecentActivities(data || []);
      await logActivity(user.id, 'dashboard_visit');
    } catch (error) {
      logger.error('Error loading activities:', { error });
      setRecentActivities([]);
    }
  };

  const checkDailyBriefing = async () => {
    if (!user) return;
    try {
      const { data: lastVisit } = await getLastVisit(user.id);
      
      if (!lastVisit) {
        await logActivity(user.id, 'daily_briefing');
        const todayActivities = await getTodayActivities(user.id);
        const briefing = await generateDailyBriefing(tasks, currentEmotion, todayActivities.data || []);
        setDailyBriefing(briefing);
      }
    } catch (error) {
      logger.error('Error checking daily briefing:', { error });
    }
  };

  const runProactiveAnalysis = () => {
    try {
      const prioritized = prioritizeTasks(tasks);
      setPrioritizedTasks(prioritized);
      
      const state = analyzeUserState(tasks, currentEmotion, recentActivities);
      
      if (state.urgency === 'high' && !microNudge) {
        const nudge = generateMicroNudge(tasks, currentEmotion, state.taskCount.completed);
        if (nudge) {
          setMicroNudge(nudge);
        }
      }

      if (shouldTriggerFocusMode(tasks, currentEmotion) && !showFocusMode) {
        const topTask = prioritized[0];
        if (topTask) {
          setShowFocusMode(true);
        }
      }

      const newSuggestion = generateSuggestion(tasks, currentEmotion);
      setSuggestion(newSuggestion);
    } catch (error) {
      logger.error('Error in proactive analysis:', { error });
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      // Add to global state
      globalAddTask({ title: newTaskTitle.trim(), priority: newTaskPriority });
      
      // Also sync to Supabase if user is logged in
      const { data } = await addTask(user.id, newTaskTitle.trim(), newTaskPriority);
      if (data) {
        setTasks([data[0], ...tasks]);
        setNewTaskTitle('');
        await logActivity(user.id, 'task_added', data[0].id, currentEmotion);
        setLastActivityTime(Date.now());
        runProactiveAnalysis();
        setTaskFeedback({ type: 'success', message: 'Task added successfully' });
        setTimeout(() => setTaskFeedback(null), 2000);
      }
    } catch (error) {
      logger.error('Error adding task:', { error });
      setTaskFeedback({ type: 'error', message: 'Failed to add task' });
      setTimeout(() => setTaskFeedback(null), 2000);
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTask = async (taskId, completed) => {
    // Update global state
    globalToggleTask(taskId);
    
    // Also sync to Supabase
    const { data } = await toggleTask(taskId, completed);
    if (data) {
      setTasks(tasks.map((task) => (task.id === taskId ? data[0] : task)));
      await logActivity(user.id, 'task_toggled', taskId, currentEmotion, { completed });
      setLastActivityTime(Date.now());
      
      // Update XP and streak
      if (completed) {
        const newXP = await calculateXP(user.id);
        setXP(newXP);
        const newStreak = await calculateStreak(user.id);
        setStreak(newStreak);
        runProactiveAnalysis();
        setTaskFeedback({ type: 'success', message: 'Task completed! +' + (completed ? '10' : '0') + ' XP' });
      } else {
        setTaskFeedback({ type: 'success', message: 'Task marked incomplete' });
      }
      setTimeout(() => setTaskFeedback(null), 2000);
      runProactiveAnalysis();
    }
  };

  const handleDeleteTask = async (taskId) => {
    // Update global state
    globalDeleteTask(taskId);
    
    // Also sync to Supabase
    const { data } = await deleteTask(taskId);
    if (data) {
      setTasks(tasks.filter((task) => task.id !== taskId));
      await logActivity(user.id, 'task_deleted', taskId, currentEmotion);
      setLastActivityTime(Date.now());
      runProactiveAnalysis();
      setTaskFeedback({ type: 'success', message: 'Task deleted' });
      setTimeout(() => setTaskFeedback(null), 2000);
    }
  };

  const handleUpdatePriority = async (taskId, priority) => {
    const { data } = await updateTaskPriority(taskId, priority);
    if (data) {
      setTasks(tasks.map((task) => (task.id === taskId ? data[0] : task)));
      await logActivity(user.id, 'task_priority_updated', taskId, currentEmotion, { priority });
      setTaskFeedback({ type: 'success', message: `Priority updated to ${priority}` });
      setTimeout(() => setTaskFeedback(null), 2000);
      runProactiveAnalysis();
    }
  };

  const handleAIAddTask = async (title, priority = 'medium') => {
    if (!user || !title.trim()) return null;
    logger.task('AI requesting to add task:', { title, priority });
    try {
      const { data } = await addTask(user.id, title.trim(), priority);
      if (data?.[0]) {
        setTasks((prev) => [data[0], ...prev]);
        await logActivity(user.id, 'task_added', data[0].id, currentEmotion);
        setLastActivityTime(Date.now());
        runProactiveAnalysis();
        setTaskFeedback({ type: 'success', message: `Added "${data[0].title}"` });
        setTimeout(() => setTaskFeedback(null), 2000);
        logger.task('Task added successfully via AI:', { title: data[0].title });
        return data[0];
      }
    } catch (error) {
      logger.error('[Task] Error adding task via AI:', error);
      setTaskFeedback({ type: 'error', message: 'AI could not add that task' });
      setTimeout(() => setTaskFeedback(null), 2000);
    }
    return null;
  };

  const handleAIDeleteTask = async (title) => {
    if (!user || !title.trim()) return null;
    logger.task('AI requesting to delete task:', { title });
    try {
      const taskToDelete = tasks.find((task) => task.title.toLowerCase() === title.toLowerCase());
      if (taskToDelete) {
        await deleteTask(taskToDelete.id);
        setTasks((prev) => prev.filter((task) => task.id !== taskToDelete.id));
        await logActivity(user.id, 'task_deleted', taskToDelete.id, currentEmotion);
        setLastActivityTime(Date.now());
        runProactiveAnalysis();
        setTaskFeedback({ type: 'success', message: `Deleted "${taskToDelete.title}"` });
        setTimeout(() => setTaskFeedback(null), 2000);
        logger.task('Task deleted successfully via AI:', { title: taskToDelete.title });
        return taskToDelete;
      } else {
        logger.warn('[Task] Task not found for deletion:', { title });
        setTaskFeedback({ type: 'error', message: `Task not found: "${title}"` });
        setTimeout(() => setTaskFeedback(null), 2000);
      }
    } catch (error) {
      logger.error('[Task] Error deleting task via AI:', { error });
      setTaskFeedback({ type: 'error', message: 'AI could not delete that task' });
      setTimeout(() => setTaskFeedback(null), 2000);
    }
    return null;
  };

  const handleSuggestionAction = async (suggestion) => {
    setSuggestionLoading(true);
    try {
      if (suggestion?.task) {
        await addTask(user.id, suggestion.task.title, suggestion.task.priority);
        setMessage('Task added ✔');
        setTimeout(() => setMessage(''), 2000);
        loadTasks();
      }
      setSuggestion(null);
    } catch (err) {
      console.error(err);
      setMessage('Failed to add task');
      setTimeout(() => setMessage(''), 2000);
    } finally {
      setSuggestionLoading(false);
    }
  };

  const getEmotionGlow = (emotion) => {
    const config = getEmotionConfig(emotion);
    return config.glow || 'shadow-violet-500/30';
  };

  const getEmotionGradient = (emotion) => {
    const config = getEmotionConfig(emotion);
    // Map gradient to background gradient format
    const gradientMap = {
      'from-red-500/20 to-orange-500/20': 'from-slate-900 via-amber-900/30 to-slate-900',
      'from-blue-500/20 to-cyan-500/20': 'from-slate-900 via-teal-900/30 to-slate-900',
      'from-cyan-500/20 to-indigo-500/20': 'from-slate-900 via-indigo-900/30 to-slate-900',
      'from-violet-500/20 to-purple-500/20': 'from-slate-900 via-violet-900/30 to-slate-900',
    };
    return gradientMap[config.gradient] || 'from-slate-900 via-violet-900/30 to-slate-900';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const glowClass = currentEmotion ? getEmotionGlow(currentEmotion) : '';
  const gradientClass = currentEmotion ? getEmotionGradient(currentEmotion) : 'from-gray-900 via-purple-900 to-gray-900';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientClass} ${glowClass} transition-all duration-500 relative`}>
      <div className="flex flex-col lg:flex-row relative z-0">
        <Sidebar
          currentEmotion={currentEmotion}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 w-full min-w-0 overflow-x-hidden relative z-0">
        {taskFeedback && (
          <div className={`fixed top-24 right-8 px-4 py-3 rounded-lg shadow-lg z-30 pointer-events-none ${
            taskFeedback.type === 'success' 
              ? 'bg-emerald-500/90 border border-emerald-400/30 text-white' 
              : 'bg-red-500/90 border border-red-400/30 text-white'
          }`}>
            <div className="flex items-center gap-2 pointer-events-auto">
              {taskFeedback.type === 'success' ? (
                <span className="text-lg">✓</span>
              ) : (
                <span className="text-lg">✕</span>
              )}
              <span className="text-sm font-medium">{taskFeedback.message}</span>
            </div>
          </div>
        )}
        <Header 
          user={user} 
          currentEmotion={currentEmotion} 
          onLogout={handleLogout}
          onMenuToggle={() => setSidebarOpen(true)}
          userProfile={userProfile}
          onProfileClick={() => setShowProfilePanel(true)}
        />  
        <div className="px-4 sm:px-8 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar size={16} />
              <span className="text-sm">{dayOfWeek}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock size={16} />
              <span className="text-sm">{formattedTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Active for {sessionDuration}</span>
          </div>
        </div>
        
        <main className="flex-1 w-full p-3 sm:p-4 lg:p-5">
            <div className="w-full space-y-3 sm:space-y-4 lg:space-y-5">
              <EmotionCard
                currentEmotion={currentEmotion}
                emotionData={latestEmotionData}
              />
              {behaviorPatterns && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                      <Target size={20} className="text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Your Patterns</h3>
                      <p className="text-xs text-gray-400">Behavior insights based on your activity</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-400 mb-1">🔥 Peak Productivity</p>
                      <p className="text-base font-semibold capitalize text-white">{behaviorPatterns.peakProductivityTime}</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-400 mb-1">⚠️ High Stress Time</p>
                      <p className="text-base font-semibold capitalize text-white">{behaviorPatterns.highStressTime}</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-400 mb-1">🧠 Work Style</p>
                      <p className="text-base font-semibold text-white">{behaviorPatterns.workStyle}</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-400 mb-1">📊 Productivity Score</p>
                      <p className="text-base font-semibold text-white">{productivityScore}/100</p>
                    </div>
                  </div>
                  {behaviorPatterns.weakAreas && behaviorPatterns.weakAreas.length > 0 && (
                    <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-400 mb-2">📉 Areas to Improve:</p>
                      <div className="flex flex-wrap gap-2">
                        {behaviorPatterns.weakAreas.map((area, index) => (
                          <span key={index} className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {todayMetrics && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                      <Flame size={20} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Today's Progress</h3>
                      <p className="text-xs text-gray-400">Your daily activity summary</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-2xl font-bold text-emerald-400">{todayMetrics.tasksCompleted}</p>
                      <p className="text-xs text-gray-400 mt-1">Tasks Completed</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-2xl font-bold text-teal-400">{todayMetrics.emotionLogs}</p>
                      <p className="text-xs text-gray-400 mt-1">Emotion Logs</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-2xl font-bold text-violet-400">{todayMetrics.focusTimeMinutes}m</p>
                      <p className="text-xs text-gray-400 mt-1">Focus Time</p>
                    </div>
                  </div>
                  {todayMetrics.dominantMood && (
                    <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-400 mb-1">Dominant Mood Today</p>
                      <p className="text-base font-semibold capitalize text-white">{todayMetrics.dominantMood}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                    <Target size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Your Achievements</h3>
                    <p className="text-xs text-gray-400">Gamification & streaks</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">🔥 Current Streak</p>
                    <p className="text-xl font-bold text-white">{streak} days</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">⭐ Total XP</p>
                    <p className="text-xl font-bold text-white">{xp} XP</p>
                  </div>
                </div>
              </div>

              <SuggestionCard
                suggestion={suggestion}
                onAction={handleSuggestionAction}
                loading={suggestionLoading}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                {dailyBriefing && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20">
                        <Zap size={20} className="text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">{dailyBriefing.greeting}</h3>
                        <p className="text-xs text-gray-400">{dailyBriefing.emotionInsight}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
                      <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-xl sm:text-2xl font-bold text-teal-400">{dailyBriefing.taskCount}</p>
                        <p className="text-xs text-gray-400 mt-1">Tasks</p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5">
                        <p className={`text-xl sm:text-2xl font-bold ${
                          dailyBriefing.urgency === 'high' ? 'text-amber-400' :
                          dailyBriefing.urgency === 'medium' ? 'text-yellow-400' :
                          'text-emerald-400'
                        }`}>{dailyBriefing.urgency}</p>
                        <p className="text-xs text-gray-400 mt-1">Urgency</p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-xl sm:text-2xl font-bold text-violet-400">{dailyBriefing.todayPlan.length}</p>
                        <p className="text-xs text-gray-400 mt-1">Planned</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 mb-2">{dailyBriefing.recommendation}</p>
                    <button
                      onClick={() => setDailyBriefing(null)}
                      className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-2xl aspect-square flex flex-col">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3">Add New Task</h3>
                  <form onSubmit={handleAddTask} className="flex flex-col gap-2 sm:gap-3 flex-1">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20 transition-all text-sm"
                      placeholder="What needs to be done?"
                    />
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20 transition-all text-sm"
                    >
                      <option value="low" className="text-white bg-slate-900">Low</option>
                      <option value="medium" className="text-white bg-slate-900">Medium</option>
                      <option value="high" className="text-white bg-slate-900">High</option>
                    </select>
                    <button
                      type="submit"
                      disabled={addingTask}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-xl text-white font-semibold hover:from-teal-600 hover:to-indigo-600 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {addingTask ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Plus size={16} />
                      )}
                      Add
                    </button>
                  </form>
                </div>

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-2xl aspect-square flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-white">Your Tasks</h3>
                    {prioritizedTasks.length > 0 && (
                      <button
                        onClick={() => setShowFocusMode(true)}
                        className="px-2 sm:px-3 py-1 sm:py-2 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-xl text-white font-medium hover:from-teal-600 hover:to-indigo-600 transition-all shadow-lg shadow-teal-500/25 flex items-center gap-2 text-xs"
                      >
                        <Zap size={14} />
                        Focus Mode
                      </button>
                    )}
                  </div>
                  <TaskList
                    tasks={tasks.slice(0, 3)}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onUpdatePriority={handleUpdatePriority}
                    currentEmotion={currentEmotion}
                  />
                </div>

                {emotionHistory.length > 0 && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-2xl aspect-square flex flex-col">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3">Emotion History</h3>
                    <div className="space-y-2 sm:space-y-3 flex-1">
                      {emotionHistory.slice(0, 3).map((emotion) => (
                        <div key={emotion.id} className="flex items-center justify-between p-2 sm:p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {emotion.source === 'detection' ? (
                              <Camera size={14} className="text-teal-400" />
                            ) : (
                              <Flame size={14} className="text-amber-400" />
                            )}
                            <div>
                              <p className="text-white font-medium capitalize text-xs sm:text-sm">{emotion.mood}</p>
                              {emotion.source === 'detection' && emotion.confidence && (
                                <p className="text-xs text-gray-400">Confidence: {Math.round(emotion.confidence * 100)}%</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Flame size={12} className="text-amber-400" />
                              <span className="text-xs text-gray-400">{emotion.stress_score || emotion.stress_level}%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(emotion.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => router.push('/analytics')}
                      className="mt-3 sm:mt-4 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      View full analytics →
                    </button>
                  </div>
                )}
              </div>

              {latestEmotionData && (latestEmotionData.source === 'detection' || latestEmotionData.source === 'ai') && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 lg:p-6 shadow-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20">
                      <Camera size={24} className="text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Latest Emotion Detection</h3>
                      <p className="text-sm text-gray-400">Detected via camera</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                    <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-3xl font-bold capitalize text-white">{latestEmotionData.mood}</p>
                      <p className="text-xs text-gray-400 mt-1">Emotion</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-3xl font-bold text-teal-400">
                        {latestEmotionData.confidence ? Math.round(latestEmotionData.confidence * 100) : 50}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Confidence</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className={`text-3xl font-bold ${
                        (latestEmotionData.stress_score || latestEmotionData.stress_level) > 60 ? 'text-amber-400' :
                        (latestEmotionData.stress_score || latestEmotionData.stress_level) > 40 ? 'text-yellow-400' :
                        'text-emerald-400'
                      }`}>
                        {latestEmotionData.stress_score || latestEmotionData.stress_level}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Stress Score</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    {new Date(latestEmotionData.created_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </main>

          <RightPanel />
        </div>

      <FloatingButton 
        onClick={toggleChat}
        currentEmotion={currentEmotion}
      />

      <ProfilePanel
        isOpen={showProfilePanel}
        onClose={() => setShowProfilePanel(false)}
        userProfile={userProfile}
        user={user}
        onProfileUpdate={handleProfileUpdate}
        onLogout={handleLogout}
      />

      {showChat && (
        <div 
          className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={toggleChat}
        >
          <div 
            className="w-full h-full sm:h-auto max-h-screen overflow-y-auto pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ChatUI
              tasks={tasks}
              currentEmotion={currentEmotion}
              behaviorPatterns={behaviorPatterns}
              userProfile={userProfile}
              onEmotionChange={updateEmotion}
              onSuggestionUpdate={(suggestion) => {
                setChatSuggestion(suggestion);
                setShowSuggestionModal(true);
              }}
              onClose={toggleChat}
              onAddTask={handleAIAddTask}
              onDeleteTask={handleAIDeleteTask}
              userEmail={user?.email}
              userId={user?.id}
            />
          </div>
        </div>
      )}

      {automationAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4 pointer-events-none">
          <div className="backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-2xl p-4 sm:p-6 max-w-md w-full mx-4 shadow-2xl pointer-events-auto">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
              {automationAlert.type === 'stress' && '⚠️ Stress Alert'}
              {automationAlert.type === 'inactivity' && '⏰ Inactivity Alert'}
              {automationAlert.type === 'pending' && '📋 Task Suggestion'}
            </h3>
            <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">{automationAlert.message}</p>
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setAutomationAlert(null);
                  if (automationAlert.task) {
                    handleToggleTask(automationAlert.task.id, true);
                  }
                }}
                className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-xl text-white font-medium hover:from-teal-600 hover:to-indigo-600 transition-all text-sm sm:text-base"
              >
                {automationAlert.type === 'stress' ? 'Take Break' : 'OK'}
              </button>
              <button
                onClick={() => setAutomationAlert(null)}
                className="flex-1 px-6 py-3 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuggestionModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pointer-events-none"
          onClick={() => {
            setShowSuggestionModal(false);
            setChatSuggestion(null);
          }}
        >
          <div className="glass-card p-4 sm:p-6 max-w-md w-full pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <AlertCircle size={20} className="text-neon-cyan" />
              <h3 className="text-base sm:text-lg font-semibold text-white">AI Suggestion</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4">
              {chatSuggestion?.suggestion || chatSuggestion?.message}
            </p>
            <button
              onClick={() => {
                setShowSuggestionModal(false);
                setChatSuggestion(null);
              }}
              className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showFocusMode && prioritizedTasks.length > 0 && (
        <FocusMode
          task={prioritizedTasks[0]}
          currentEmotion={currentEmotion}
          onClose={() => setShowFocusMode(false)}
        />
      )}

      {microNudge && (
        <MicroNudge
          nudge={microNudge}
          onClose={() => setMicroNudge(null)}
        />
      )}
      </div>
    </div>
  );
}
