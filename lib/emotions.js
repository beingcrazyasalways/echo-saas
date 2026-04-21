import { supabase } from './supabaseClient';

export const fetchEmotions = async (userId) => {
  const { data, error } = await supabase
    .from('emotions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  return { data, error };
};

export const logEmotion = async (userId, mood, stressLevel, stressScore = null, confidence = null, source = 'manual') => {
  const { data, error } = await supabase
    .from('emotions')
    .insert([
      {
        user_id: userId,
        mood,
        stress_level: stressLevel,
        stress_score: stressScore,
        confidence,
        source,
        created_at: new Date().toISOString(), // Explicit timestamp for consistency
      },
    ])
    .select();
  return { data, error };
};

export const logEmotionFromDetection = async (userId, emotion, confidence, stressScore) => {
  return logEmotion(userId, emotion, stressScore, stressScore, confidence, 'detection');
};

export const getLatestEmotion = async (userId) => {
  const { data, error } = await supabase
    .from('emotions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return { data, error };
};
