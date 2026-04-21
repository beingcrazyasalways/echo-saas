import { supabase } from './supabaseClient';

export const fetchTasks = async (userId) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const addTask = async (userId, title, priority = 'medium') => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        user_id: userId,
        title,
        completed: false,
        priority,
      },
    ])
    .select();
  return { data, error };
};

export const toggleTask = async (taskId, completed) => {
  const { data, error } = await supabase
    .from('tasks')
    .update({ completed })
    .eq('id', taskId)
    .select();
  return { data, error };
};

export const deleteTask = async (taskId) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  return { error };
};

export const updateTaskPriority = async (taskId, priority) => {
  const { data, error } = await supabase
    .from('tasks')
    .update({ priority })
    .eq('id', taskId)
    .select();
  return { data, error };
};
