-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create emotions table
CREATE TABLE IF NOT EXISTS emotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('stressed', 'calm', 'focused')),
  stress_level INTEGER DEFAULT 50 CHECK (stress_level >= 0 AND stress_level <= 100),
  stress_score INTEGER DEFAULT 50 CHECK (stress_score >= 0 AND stress_score <= 100),
  confidence DECIMAL(3, 2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns if table exists
ALTER TABLE emotions ADD COLUMN IF NOT EXISTS stress_score INTEGER DEFAULT 50 CHECK (stress_score >= 0 AND stress_score <= 100);
ALTER TABLE emotions ADD COLUMN IF NOT EXISTS confidence DECIMAL(3, 2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1);
ALTER TABLE emotions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Create activity table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  emotion TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_behavior table for behavior learning
CREATE TABLE IF NOT EXISTS user_behavior (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('task', 'emotion', 'session')),
  emotion TEXT CHECK (emotion IN ('stressed', 'calm', 'focused')),
  task_priority TEXT CHECK (task_priority IN ('low', 'medium', 'high')),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  task_duration_minutes INTEGER,
  session_duration_minutes INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profile table for storing user traits and memory
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT,
  full_name TEXT,
  age INTEGER,
  designation TEXT,
  work_role TEXT,
  bio TEXT,
  avatar_url TEXT,
  productivity_score INTEGER DEFAULT 50 CHECK (productivity_score >= 0 AND productivity_score <= 100),
  peak_productivity_time TEXT CHECK (peak_productivity_time IN ('morning', 'afternoon', 'evening', 'night')),
  high_stress_time TEXT CHECK (high_stress_time IN ('morning', 'afternoon', 'evening', 'night')),
  work_style TEXT,
  weak_areas TEXT[],
  traits JSONB DEFAULT '{}',
  daily_summary TEXT,
  last_summary_date DATE,
  emotion_history_summary JSONB DEFAULT '{}',
  productivity_patterns JSONB DEFAULT '{}',
  ai_memory_summary TEXT,
  ai_context JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for emotions
DROP POLICY IF EXISTS "Users can view their own emotions" ON emotions;
CREATE POLICY "Users can view their own emotions"
  ON emotions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own emotions" ON emotions;
CREATE POLICY "Users can insert their own emotions"
  ON emotions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for activities
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
CREATE POLICY "Users can view their own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
CREATE POLICY "Users can insert their own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for user_behavior
DROP POLICY IF EXISTS "Users can view their own behavior" ON user_behavior;
CREATE POLICY "Users can view their own behavior"
  ON user_behavior FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own behavior" ON user_behavior;
CREATE POLICY "Users can insert their own behavior"
  ON user_behavior FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for user_profile
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profile;
CREATE POLICY "Users can view their own profile"
  ON user_profile FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profile;
CREATE POLICY "Users can insert their own profile"
  ON user_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profile;
CREATE POLICY "Users can update their own profile"
  ON user_profile FOR UPDATE
  USING (auth.uid() = user_id);

-- Add new columns for existing installations
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4() PRIMARY KEY;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS work_role TEXT;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Seed user profiles for pre-registered company users
-- Note: Auth users must be created via Supabase Dashboard or Auth API first
-- These profiles will be linked to the auth users by email matching

-- Suryansh profile
INSERT INTO user_profile (user_id, name, productivity_score, peak_productivity_time, work_style, ai_memory_summary, ai_context)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'suryansh@echo.ai' LIMIT 1),
  'Suryansh',
  75,
  'morning',
  'Analytical and structured approach',
  'Suryansh shows strong focus in morning sessions. Prefers breaking down complex tasks into smaller steps.',
  '{"preferred_greeting": "Welcome back, Suryansh", "tone": "professional", "encouragement_style": "progress-focused"}'
)
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  ai_memory_summary = EXCLUDED.ai_memory_summary,
  ai_context = EXCLUDED.ai_context;

-- Rudra profile
INSERT INTO user_profile (user_id, name, productivity_score, peak_productivity_time, work_style, ai_memory_summary, ai_context)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'rudra@echo.ai' LIMIT 1),
  'Rudra',
  68,
  'afternoon',
  'Creative and flexible approach',
  'Rudra performs best in afternoon sessions. Responds well to creative task suggestions.',
  '{"preferred_greeting": "Good to see you again, Rudra", "tone": "friendly", "encouragement_style": "creative"}'
)
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  ai_memory_summary = EXCLUDED.ai_memory_summary,
  ai_context = EXCLUDED.ai_context;

-- Sudhanshu profile
INSERT INTO user_profile (user_id, name, productivity_score, peak_productivity_time, work_style, ai_memory_summary, ai_context)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'sudhanshu@echo.ai' LIMIT 1),
  'Sudhanshu',
  82,
  'evening',
  'Consistent and methodical approach',
  'Sudhanshu has shown steady improvement in stress management. Evening sessions are most productive.',
  '{"preferred_greeting": "Sudhanshu, your stress trend is lower today. Good progress.", "tone": "supportive", "encouragement_style": "wellness-focused"}'
)
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  ai_memory_summary = EXCLUDED.ai_memory_summary,
  ai_context = EXCLUDED.ai_context;

-- Nitin profile
INSERT INTO user_profile (user_id, name, productivity_score, peak_productivity_time, work_style, ai_memory_summary, ai_context)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'nitin@echo.ai' LIMIT 1),
  'Nitin',
  70,
  'evening',
  'Goal-oriented and focused approach',
  'Nitin is most productive in evening sessions. Shows strong task completion rates.',
  '{"preferred_greeting": "Nitin, you are most productive in evening sessions.", "tone": "motivational", "encouragement_style": "achievement-focused"}'
)
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  ai_memory_summary = EXCLUDED.ai_memory_summary,
  ai_context = EXCLUDED.ai_context;
