import { supabase } from './supabaseClient';

export async function logActivity(userId, action, taskId = null, emotion = null, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        action,
        task_id: taskId,
        emotion,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { data: null, error };
  }
}

export async function fetchRecentActivities(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching activities:', error);
    return { data: [], error };
  }
}

export async function getTodayActivities(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching today activities:', error);
    return { data: [], error };
  }
}

export async function getLastVisit(userId) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('created_at')
      .eq('user_id', userId)
      .eq('action', 'dashboard_visit')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching last visit:', error);
    return { data: null, error };
  }
}
