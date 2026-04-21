import { supabase } from './supabaseClient';

// Fetch user profile for AI personalization
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[UserProfile] Error fetching user profile:', error);
    return null;
  }
}

// Create or update user profile
export async function upsertUserProfile(userId, profileData) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[UserProfile] Error upserting user profile:', error);
    return null;
  }
}

// Get user name from profile
export async function getUserName(userId) {
  const profile = await getUserProfile(userId);
  return profile?.name || null;
}

// Seeded user identities (system-level mapping)
const SEEDED_USERS = {
  'suryansh@echo.ai': { name: 'Suryansh' },
  'rudra@echo.ai': { name: 'Rudra' },
  'sudhanshu@echo.ai': { name: 'Sudhanshu' },
  'nitin@echo.ai': { name: 'Nitin' },
};

// Get seeded user name by email
export function getSeededUserName(email) {
  return SEEDED_USERS[email]?.name || null;
}

// Check if email is a seeded user
export function isSeededUser(email) {
  return email in SEEDED_USERS;
}
