# E.C.H.O - Emotionally Conscious Helper & Optimizer

## Project Overview

E.C.H.O is a real-time intelligent task management system that combines emotional intelligence with productivity tracking. It uses AI to provide personalized suggestions based on the user's emotional state, behavior patterns, and task context. The system integrates emotion detection, task management, behavior analysis, and AI-powered recommendations into a cohesive productivity platform.

**Project Name:** E.C.H.O (Emotionally Conscious Helper & Optimizer)  
**Type:** Web Application (Next.js)  
**Development Timeline:** 2025-2026  
**Status:** Production-Ready with Advanced Features

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14.2.35 (App Router)
- **Language:** JavaScript (React)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **UI Components:** Custom components with glass-morphism design

### Backend
- **API:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **AI Services:**
  - Mistral AI (Chat completions, emotion analysis)
  - DeepFace API (Emotion detection - with fallback)
- **Authentication:** Supabase Auth

### Development Tools
- **Package Manager:** npm
- **Version Control:** Git
- **Environment:** Windows (PowerShell)

---

## Core Features

### 1. Real-Time Dashboard
- Live clock display with session duration tracking
- Dynamic greeting based on time of day
- Real-time task management (add, toggle, delete)
- Emotion tracking with manual and detection modes
- Auto-refreshing AI suggestions (10-20 second intervals)

### 2. Emotion Detection & Analysis
- Manual emotion selection (stressed, calm, focused)
- Camera-based emotion detection using AI
- Image upload analysis
- Video frame analysis
- "Last detected emotion" timestamp display
- Confidence scores and stress metrics

### 3. Behavior Intelligence Layer
- Tracks user behavior patterns
- Analyzes productivity by emotion and time of day
- Calculates stress impact on task completion
- Generates personalized insights
- Daily metrics tracking with midnight reset
- Session duration calculation

### 4. AI-Powered Suggestions
- Context-aware recommendations based on:
  - Current emotional state
  - Task list and priorities
  - Behavior patterns
  - Time of day
- Proactive analysis and suggestions
- Auto-generated insights in analytics

### 5. Light Automation
- Stress alert popups (when stress score > 70)
- Inactivity alerts (no activity for 30 minutes)
- Task suggestions based on pending high-priority tasks
- Automated proactive triggers

### 6. Gamification
- Streak system (consecutive productive days)
- XP system (points for completing tasks)
- Priority-based XP multipliers
- Achievement tracking

### 7. E.C.H.O AI Chatbot
- Floating chat interface with modal overlay
- Mistral AI-powered conversational assistant
- Task management via chat (add/delete tasks)
- Personalized suggestions for general questions
- Natural language processing
- Context-aware responses using behavior patterns

### 8. Analytics Dashboard
- Task completion statistics
- Emotion distribution charts
- Productivity trends
- Auto-generated insights
- Peak productivity time identification
- High stress time tracking
- Weak area analysis

---

## Database Schema

### Tables

#### `tasks`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `title` (TEXT)
- `completed` (BOOLEAN)
- `priority` (TEXT: 'low', 'medium', 'high')
- `created_at` (TIMESTAMP)

#### `emotions`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `mood` (TEXT: 'stressed', 'calm', 'focused')
- `stress_level` (INTEGER, 0-100)
- `stress_score` (INTEGER, 0-100)
- `confidence` (DECIMAL, 0-1)
- `source` (TEXT: 'manual', 'detection')
- `created_at` (TIMESTAMP)

#### `activities`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `action` (TEXT)
- `task_id` (UUID, Foreign Key to tasks)
- `emotion` (TEXT)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)

#### `user_behavior`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `task_id` (UUID, Foreign Key to tasks)
- `type` (TEXT: 'task', 'emotion', 'session')
- `emotion` (TEXT: 'stressed', 'calm', 'focused')
- `task_priority` (TEXT: 'low', 'medium', 'high')
- `completed_at` (TIMESTAMP)
- `time_of_day` (TEXT: 'morning', 'afternoon', 'evening', 'night')
- `task_duration_minutes` (INTEGER)
- `session_duration_minutes` (INTEGER)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)

#### `user_profile`
- `user_id` (UUID, Primary Key, Foreign Key to auth.users)
- `productivity_score` (INTEGER, 0-100)
- `peak_productivity_time` (TEXT: 'morning', 'afternoon', 'evening', 'night')
- `high_stress_time` (TEXT: 'morning', 'afternoon', 'evening', 'night')
- `work_style` (TEXT)
- `weak_areas` (TEXT[])
- `traits` (JSONB)
- `daily_summary` (TEXT)
- `last_summary_date` (DATE)
- `updated_at` (TIMESTAMP)

---

## Project Structure

```
c:\Final Capstone Project E.C.H.O\
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   └── route.js                    # Mistral AI chat endpoint
│   │   └── emotion/
│   │       └── analyze/
│   │           └── route.js                # Emotion analysis endpoint
│   ├── dashboard/
│   │   └── page.jsx                        # Main dashboard with all features
│   ├── emotion/
│   │   └── page.jsx                        # Emotion detection page
│   ├── analytics/
│   │   └── page.jsx                        # Analytics dashboard
│   ├── settings/
│   │   └── page.jsx                        # Settings page
│   ├── page.jsx                            # Landing page
│   ├── layout.jsx                          # Root layout
│   └── globals.css                         # Global styles
├── components/
│   ├── Header.jsx                          # Header with time context
│   ├── Sidebar.jsx                         # Navigation sidebar
│   ├── TaskList.jsx                        # Task list component
│   ├── EmotionCard.jsx                     # Emotion display card
│   ├── RightPanel.jsx                      # Right panel container
│   ├── ChatUI.jsx                          # AI chat interface
│   └── FloatingButton.jsx                  # Chat trigger button
├── lib/
│   ├── supabaseClient.js                   # Supabase client configuration
│   ├── emotions.js                         # Emotion CRUD operations
│   ├── tasks.js                            # Task CRUD operations
│   ├── activities.js                       # Activity logging
│   ├── aiSuggestions.js                    # Local AI suggestion engine
│   ├── behavior.js                         # Behavior tracking & analysis
│   └── behaviorIntelligence.js             # Advanced behavior intelligence
├── hooks/
│   └── useTimeContext.js                   # Time context hook
├── .env.local                              # Environment variables (local)
├── .env.example                            # Environment variables template
├── supabase-setup.sql                       # Database schema
├── package.json                            # Dependencies
└── PROJECT_DOCUMENTATION.md                 # This file
```

---

## API Endpoints

### POST `/api/ai`
**Purpose:** AI chatbot with Mistral AI integration  
**Request Body:**
```json
{
  "message": "string",
  "tasks": [],
  "emotion": "stressed|calm|focused",
  "behaviorPatterns": {}
}
```
**Response:**
```json
{
  "message": "string",
  "suggestion": "string",
  "action": null | {
    "type": "add_task|delete_task",
    "title": "string",
    "priority": "low|medium|high"
  }
}
```

### POST `/api/emotion/analyze`
**Purpose:** Analyze emotion from image/video  
**Request Body:**
```json
{
  "image": "base64_image_data"
}
```
**Response:**
```json
{
  "emotion": "stressed|calm|focused",
  "confidence": 0.5,
  "stress_score": 30,
  "fallback": boolean
}
```

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mistral AI API Key (for emotion analysis and chat)
# Get your API key from: https://console.mistral.ai/
MISTRAL_API_KEY=your_mistral_api_key_here
```

---

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Mistral AI API key

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Final Capstone Project E.C.H.O"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at https://supabase.com/
   - Run the SQL from `supabase-setup.sql` in the Supabase SQL editor
   - Copy your project URL and anon key

4. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials
   - Add your Mistral AI API key

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open http://localhost:3000 in your browser

---

## Key Components & Their Functions

### Behavior Intelligence Layer (`lib/behaviorIntelligence.js`)
- `analyzeBehaviorPatterns(userId)` - Comprehensive behavior analysis
- `getTodayMetrics(userId)` - Daily metrics calculation
- `calculateProductivityScore(userId)` - Productivity scoring
- `calculateStreak(userId)` - Streak tracking
- `calculateXP(userId)` - Experience points calculation
- `generateDailySummary(userId)` - Daily summary generation

### Dashboard (`app/dashboard/page.jsx`)
- Main application interface
- Integrates all features in one view
- Real-time updates and automation
- Chatbot integration
- Task management
- Emotion tracking

### AI Chatbot (`components/ChatUI.jsx`)
- Floating chat interface
- Natural language processing
- Task management via chat
- Personalized suggestions
- Context-aware responses

### Emotion Detection (`app/emotion/page.jsx`)
- Camera access and image capture
- Real-time emotion analysis
- Video frame analysis
- Multiple input modes (camera, image, video)

---

## Development History & Evolution

### Phase 1: Core Functionality
- Basic task management with Supabase
- Manual emotion tracking
- Simple UI with Tailwind CSS

### Phase 2: AI Integration
- Local AI suggestion engine
- Basic behavior tracking
- Activity logging

### Phase 3: Real-Time Intelligence
- Live clock and session tracking
- Dynamic greetings
- Auto-refreshing suggestions
- Time-based context

### Phase 4: Behavior Intelligence
- Comprehensive behavior analysis
- Daily metrics system
- Pattern recognition
- Productivity scoring

### Phase 5: Automation & Gamification
- Light automation (alerts, popups)
- Streak system
- XP system
- Proactive triggers

### Phase 6: AI Chatbot Integration
- Mistral AI integration
- Floating chat interface
- Natural language task management
- Personalized suggestions

### Phase 7: Advanced Features
- Emotion detection with AI
- Video analysis
- Auto-generated insights
- Enhanced analytics

---

## Design Patterns & Architecture

### State Management
- React hooks (useState, useEffect)
- Context API for time context
- Local state for component-level data

### Data Flow
- Supabase as single source of truth
- Real-time updates via React state
- Behavior patterns calculated on-demand

### Component Architecture
- Functional components with hooks
- Reusable UI components
- Separation of concerns (UI vs logic)

### Error Handling
- Try-catch blocks for async operations
- Fallback mechanisms for AI failures
- Graceful degradation

---

## Known Issues & Limitations

1. **Emotion Detection Accuracy:** Falls back to time-based heuristics if Mistral AI fails
2. **AI Context:** Behavior patterns may be limited for new users
3. **Browser Compatibility:** Requires modern browser with camera support
4. **Performance:** Video analysis may be slow for long videos

---

## Future Enhancements

1. **Mobile App:** React Native implementation
2. **Voice Commands:** Speech-to-text for chat
3. **Calendar Integration:** Sync with external calendars
4. **Team Features:** Shared tasks and team analytics
5. **Advanced Analytics:** Machine learning predictions
6. **Custom Themes:** User-customizable themes
7. **Export Features:** Data export and reporting
8. **Integration Hub:** Connect with other productivity tools

---

## Maintenance & Support

### Regular Maintenance Tasks
- Monitor Supabase database performance
- Update dependencies regularly
- Review and optimize AI prompts
- Check API rate limits

### Debugging Tips
- Check browser console for errors
- Review server logs for API issues
- Verify environment variables
- Test with sample data

---

## Credits & Acknowledgments

- **Framework:** Next.js team
- **Database:** Supabase
- **AI Services:** Mistral AI, DeepFace
- **Icons:** Lucide React
- **Styling:** Tailwind CSS

---

## Contact & Support

For issues or questions, refer to the project repository or contact the development team.

---

**Last Updated:** April 2026  
**Version:** 1.0.0  
**Status:** Production-Ready
