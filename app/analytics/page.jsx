'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSession } from '../../lib/supabaseClient';
import { fetchTasks } from '../../lib/tasks';
import { fetchEmotions } from '../../lib/emotions';
import { analyzeBehaviorPatterns, getTodayMetrics } from '../../lib/behaviorIntelligence';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { TrendingUp, CheckCircle, Clock, Flame, Brain, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState('');
  const [behaviorPatterns, setBehaviorPatterns] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedEmotion = localStorage.getItem('currentEmotion');
    if (savedEmotion) {
      setCurrentEmotion(savedEmotion);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const checkAuth = async () => {
    const { session } = await getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    const { user: currentUser } = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const loadData = async () => {
    if (!user) return;
    const { data: tasksData } = await fetchTasks(user.id);
    const { data: emotionsData } = await fetchEmotions(user.id);
    setTasks(tasksData || []);
    setEmotions(emotionsData || []);

    // Load behavior patterns using new function
    const patterns = await analyzeBehaviorPatterns(user.id);
    setBehaviorPatterns(patterns);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-violet-900/30 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const highPriorityTasks = tasks.filter((t) => t.priority === 'high' && !t.completed).length;

  const stressLevels = emotions.map((e) => e.stress_level);
  const avgStress = stressLevels.length > 0 
    ? Math.round(stressLevels.reduce((a, b) => a + b, 0) / stressLevels.length) 
    : 0;

  const moodCounts = emotions.reduce((acc, emotion) => {
    acc[emotion.mood] = (acc[emotion.mood] || 0) + 1;
    return acc;
  }, {});

  const recentEmotions = emotions.slice(0, 7).reverse();

  // Group emotions by day
  const emotionsByDay = emotions.reduce((acc, emotion) => {
    const date = new Date(emotion.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(emotion);
    return acc;
  }, {});

  // Group emotions by time of day
  const emotionsByTimeOfDay = emotions.reduce((acc, emotion) => {
    const hour = new Date(emotion.created_at).getHours();
    let timeOfDay;
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    if (!acc[timeOfDay]) {
      acc[timeOfDay] = [];
    }
    acc[timeOfDay].push(emotion);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/30 to-slate-900">
      <Sidebar 
        currentEmotion={currentEmotion} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="w-full">
        <Header 
          user={user} 
          currentEmotion={currentEmotion} 
          onMenuToggle={() => setSidebarOpen(true)}
        />
        
        <main className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Analytics</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="glass-card p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="text-neon-cyan" size={20} sm:size={24} />
                  <span className="text-xs sm:text-sm text-gray-400">Completion Rate</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{completionRate}%</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{completedTasks} of {totalTasks} tasks</p>
              </div>

              <div className="glass-card p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="text-neon-purple" size={20} sm:size={24} />
                  <span className="text-xs sm:text-sm text-gray-400">Total Tasks</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{totalTasks}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">All time</p>
              </div>

              <div className="glass-card p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="text-neon-cyan" size={20} sm:size={24} />
                  <span className="text-xs sm:text-sm text-gray-400">High Priority</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{highPriorityTasks}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Pending tasks</p>
              </div>

              <div className="glass-card p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Flame className="text-neon-red" size={20} sm:size={24} />
                  <span className="text-xs sm:text-sm text-gray-400">Avg Stress</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{avgStress}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Based on {emotions.length} logs</p>
              </div>
            </div>

            {behaviorPatterns && (
              <div className="glass-card p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <Brain className="text-neon-purple" size={20} sm:size={24} />
                  <h3 className="text-base sm:text-lg font-semibold text-white">Auto Insights</h3>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">🔥 Peak Productivity Time</p>
                    <p className="text-base sm:text-lg font-semibold capitalize text-white">{behaviorPatterns.peakProductivityTime}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">⚠️ High Stress Time</p>
                    <p className="text-base sm:text-lg font-semibold capitalize text-white">{behaviorPatterns.highStressTime}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">🧠 Work Style</p>
                    <p className="text-base sm:text-lg font-semibold text-white">{behaviorPatterns.workStyle}</p>
                  </div>
                  {behaviorPatterns.weakAreas && behaviorPatterns.weakAreas.length > 0 && (
                    <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xs sm:text-sm text-gray-400 mb-2">📉 Areas to Improve</p>
                      <div className="flex flex-wrap gap-2">
                        {behaviorPatterns.weakAreas.map((area, index) => (
                          <span key={index} className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs sm:text-sm">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {behaviorPatterns && (
                <div className="glass-card p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Productivity by Emotion</h3>
                  <div className="space-y-4">
                    {Object.entries(behaviorPatterns.productivityByEmotion || {}).map(([emotion, count]) => {
                      const total = Object.values(behaviorPatterns.productivityByEmotion).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                      const colors = {
                        stressed: 'bg-red-500',
                        calm: 'bg-blue-500',
                        focused: 'bg-cyan-500',
                      };
                      return (
                        <div key={emotion}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300 capitalize">{emotion}</span>
                            <span className="text-gray-400">{count} tasks ({percentage}%)</span>
                          </div>
                          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${colors[emotion] || 'bg-purple-500'}`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Mood Distribution</h3>
                <div className="space-y-2 sm:space-y-3">
                  {Object.entries(moodCounts).map(([mood, count]) => {
                    const percentage = emotions.length > 0 ? Math.round((count / emotions.length) * 100) : 0;
                    const colors = {
                      stressed: 'bg-red-500',
                      calm: 'bg-blue-500',
                      focused: 'bg-cyan-500',
                    };
                    return (
                      <div key={mood}>
                        <div className="flex justify-between text-xs sm:text-sm mb-1">
                          <span className="text-gray-300 capitalize">{mood}</span>
                          <span className="text-gray-400">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[mood] || 'bg-purple-500'}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Stress Timeline (Last 7 Days)</h3>
                <div className="space-y-2">
                  {recentEmotions.length > 0 ? (
                    recentEmotions.map((emotion, index) => {
                      const stressScore = emotion.stress_score || emotion.stress_level;
                      const height = stressScore;
                      const color = stressScore > 60 ? 'bg-red-500' : stressScore > 40 ? 'bg-yellow-500' : 'bg-green-500';
                      return (
                        <div key={emotion.id} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20">
                            {new Date(emotion.created_at).toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${color} transition-all`}
                              style={{ width: `${height}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-400 w-8">{stressScore}%</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-400 text-sm">No emotion logs yet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Emotion Timeline</h3>
              <div className="space-y-3 sm:space-y-4">
                {recentEmotions.length > 0 ? (
                  recentEmotions.map((emotion) => {
                    const confidence = emotion.confidence ? Math.round(emotion.confidence * 100) : null;
                    const source = emotion.source === 'detection' ? '📷' : '👤';
                    const stressScore = emotion.stress_score || emotion.stress_level;
                    return (
                      <div key={emotion.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <span className="text-xl sm:text-2xl">{source}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm sm:text-base text-white font-medium capitalize">{emotion.mood}</span>
                              {confidence && (
                                <span className="text-xs px-2 py-1 rounded-full bg-neon-cyan/20 text-neon-cyan">
                                  {confidence}% confidence
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">
                              {new Date(emotion.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Flame size={14} className="text-neon-red" />
                            <span className="text-lg font-bold text-white">{stressScore}%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Stress Score</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-400 text-center py-8">No emotion logs yet. Visit the Emotion page to start tracking.</p>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-sm text-gray-400 mb-2">Productivity Insight</p>
                  <p className="text-white">
                    {avgStress < 40 
                      ? "You're most productive when calm. Maintain this state for better results."
                      : avgStress > 60
                      ? "High stress levels may be reducing your productivity. Consider taking breaks."
                      : "Your stress levels are balanced. Keep monitoring for optimal performance."
                    }
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-sm text-gray-400 mb-2">Emotion Pattern</p>
                  <p className="text-white">
                    {moodCounts.calm > moodCounts.stressed && moodCounts.calm > moodCounts.focused
                      ? "You tend to be calm most of the time. Great for planning and learning."
                      : moodCounts.stressed > moodCounts.calm && moodCounts.stressed > moodCounts.focused
                      ? "You've been stressed frequently. Consider stress management techniques."
                      : moodCounts.focused > moodCounts.calm && moodCounts.focused > moodCounts.stressed
                      ? "You're often in a focused state. Good for tackling high-priority tasks."
                      : "Your emotions are well-balanced across different states."
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Task Priority Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                  <p className="text-2xl font-bold text-red-400">
                    {tasks.filter((t) => t.priority === 'high').length}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">High Priority</p>
                </div>
                <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <p className="text-2xl font-bold text-yellow-400">
                    {tasks.filter((t) => t.priority === 'medium').length}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Medium Priority</p>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                  <p className="text-2xl font-bold text-green-400">
                    {tasks.filter((t) => t.priority === 'low').length}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Low Priority</p>
                </div>
              </div>
            </div>

            {behaviorPatterns && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain size={24} className="text-neon-cyan" />
                  <h3 className="text-lg font-semibold text-white">Behavior Insights</h3>
                </div>
                
                {behaviorPatterns.insights.length > 0 ? (
                  <div className="space-y-3">
                    {behaviorPatterns.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <BarChart3 size={16} className="text-neon-cyan mt-1 flex-shrink-0" />
                        <p className="text-sm text-gray-300">{insight}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Complete more tasks to unlock behavior insights.</p>
                )}
              </div>
            )}

            {behaviorPatterns && behaviorPatterns.peakProductivityTime && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Peak Productivity Time</h3>
                <div className="text-center p-6 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30">
                  <Clock size={32} className="text-neon-cyan mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white capitalize">{behaviorPatterns.peakProductivityTime}</p>
                  <p className="text-sm text-gray-400 mt-1">You complete most tasks during this time</p>
                </div>
              </div>
            )}

            {behaviorPatterns && behaviorPatterns.stressImpact !== null && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Stress Impact Analysis</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-gray-300">Tasks completed when stressed</span>
                    <span className={`text-2xl font-bold ${
                      behaviorPatterns.stressImpact > 30 ? 'text-red-400' :
                      behaviorPatterns.stressImpact < 20 ? 'text-green-400' :
                      'text-yellow-400'
                    }`}>
                      {behaviorPatterns.stressImpact}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {behaviorPatterns.stressImpact > 30
                      ? "You struggle to complete tasks when stressed. Consider stress management techniques."
                      : behaviorPatterns.stressImpact < 20
                      ? "You manage stress well and maintain productivity even when stressed."
                      : "Your stress levels have a moderate impact on your productivity."
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
