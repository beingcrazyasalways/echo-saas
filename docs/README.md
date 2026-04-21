# E.C.H.O - Emotion-Centric Human Optimizer

An AI-powered productivity system that adapts tasks and suggestions based on user emotions.

## 🚀 Features

- **Emotion-Based Task Management**: The system detects or stores emotional state and suggests tasks accordingly
- **AI Suggestion Engine**: Smart task recommendations based on current mood (stressed, calm, focused)
- **Dynamic Dashboard**: UI adapts with color glows based on emotional state
- **Task Prioritization**: Organize tasks by priority (low, medium, high)
- **Analytics Dashboard**: Track completion rates, stress levels, and mood trends
- **Supabase Backend**: Secure authentication and real-time database

## 🛠 Tech Stack

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS
- React Hooks
- Lucide Icons

### Backend
- Supabase (Authentication + Database + Storage)

### State Management
- React State + Supabase Queries

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
cd "c:\Final Capstone Project E.C.H.O"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to Settings > API to get your credentials
4. Run the SQL setup script (see `supabase-setup.sql` below) in the Supabase SQL Editor

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your actual Supabase credentials from step 3.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Folder Structure

```
/app
  /login/page.jsx          # Authentication page
  /dashboard/page.jsx      # Main dashboard with emotion-based UI
  /tasks/page.jsx          # Task management page
  /analytics/page.jsx      # Analytics and insights
  /settings/page.jsx       # User settings
  layout.jsx               # Root layout
  page.jsx                 # Home page (redirects based on auth)
  globals.css              # Global styles with glassmorphism

/components
  Sidebar.jsx              # Navigation sidebar
  Header.jsx               # Top header with user info
  SuggestionCard.jsx       # AI suggestion display
  TaskList.jsx             # Task list container
  TaskItem.jsx             # Individual task component
  EmotionCard.jsx          # Emotion selection card
  RightPanel.jsx           # Right panel container
  FloatingButton.jsx       # Floating AI button

/lib
  supabaseClient.js        # Supabase client and auth functions
  tasks.js                 # Task CRUD operations
  emotions.js              # Emotion logging and retrieval
  aiSuggestions.js         # AI suggestion engine logic
```

## 🗄️ Supabase Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotions ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for emotions
CREATE POLICY "Users can view their own emotions"
  ON emotions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emotions"
  ON emotions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## 🎨 AI Suggestion Engine Logic

The system suggests tasks based on emotional state:

- **Stressed**: Suggests the smallest incomplete task or recommends a break
- **Focused**: Suggests high-priority tasks to maintain momentum
- **Calm**: Suggests planning or learning tasks

## 🎯 Key Features

### Emotion-Based UI
- **Stressed**: Red glow effect
- **Calm**: Blue glow effect
- **Focused**: Cyan glow effect

### Task Management
- Add tasks with priority levels
- Toggle completion status
- Delete tasks
- Filter by status and priority

### Analytics
- Completion rate tracking
- Task priority breakdown
- Mood distribution charts
- Stress level trends

## 🚢 Deployment

### Vercel (Frontend)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Supabase (Backend)

Already hosted on Supabase cloud - no additional deployment needed.

## 📝 Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## 🧪 Testing

The application is ready for testing with:
- Email signup/signin
- Task creation and management
- Emotion logging
- AI suggestions
- Analytics dashboard

## 🎨 Design System

- **Theme**: Dark futuristic
- **Style**: Glassmorphism cards with neon accents
- **Colors**: Neon cyan (#00f5ff), Neon purple (#bf00ff), Neon red (#ff0055)
- **Animations**: Smooth hover effects and transitions
- **Layout**: Desktop-first (1440px+)

## 📄 License

This project is part of a Final Capstone Project.
