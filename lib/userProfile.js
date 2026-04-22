import { supabase } from './supabaseClient';

/**
 * Fetch user profile from Supabase
 * @param {string} userId - The user's UUID from Supabase auth
 * @returns {Promise<Object|null>} The user profile or null if not found
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Create or update user profile
 * @param {string} userId - The user's UUID from Supabase auth
 * @param {Object} profileData - The profile data to upsert
 * @returns {Promise<Object|null>} The updated profile or null if error
 */
export async function upsertUserProfile(userId, profileData) {
  try {
    const { data, error } = await supabase
      .from('user_profile')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }
}

/**
 * Update AI context for a user
 * @param {string} userId - The user's UUID from Supabase auth
 * @param {Object} contextData - The AI context data to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateAIContext(userId, contextData) {
  try {
    const { error } = await supabase
      .from('user_profile')
      .update({
        ai_context: contextData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating AI context:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating AI context:', error);
    return false;
  }
}

/**
 * Get personalized greeting for user
 * @param {Object} userProfile - The user profile object
 * @returns {string} Personalized greeting
 */
export function getPersonalizedGreeting(userProfile) {
  if (!userProfile || !userProfile.name) {
    return 'Welcome back';
  }

  const { name, ai_context } = userProfile;
  
  // Use preferred greeting from AI context if available
  if (ai_context && ai_context.preferred_greeting) {
    return ai_context.preferred_greeting;
  }

  // Default personalized greeting
  return `Welcome back, ${name}`;
}
