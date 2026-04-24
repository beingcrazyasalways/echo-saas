# E.C.H.O - Emotion-Centric Human Optimizer

An AI-powered productivity and mental wellness SaaS platform that adapts to your emotions in real-time.

## ✨ Key Features

### 🎭 AI-Powered Emotion Detection
- **Real-time Facial Recognition**: Advanced CNN model detects 7 emotions (angry, disgusted, fearful, happy, neutral, sad, surprised)
- **Live Camera Feed**: WebRTC integration with face alignment tracking
- **Auto-Detection Mode**: Continuous emotion monitoring with smart throttling
- **Image Upload Support**: Analyze emotions from uploaded photos
- **Confidence Scoring**: AI provides confidence levels for each detection

### 🗣️ Voice Mode (ChatGPT-Style)
- **Full-Screen Immersive UI**: Dark glassmorphism design with animated elements
- **Speech-to-Text**: Web Speech API for natural voice input
- **Text-to-Speech**: Browser-native speech synthesis with voice selection
- **State Machine**: Idle → Listening → Thinking → Speaking flow
- **Manual Control**: Tap microphone to start/stop, swipe down to exit
- **Text Fallback**: Shows AI response text when audio fails

### 💬 Emotionally Aware AI Chat
- **Mistral AI Integration**: Advanced LLM for human-like conversations
- **Dynamic Personality**: AI adapts tone based on your current emotion
- **Context-Aware Responses**: Considers stress level, mood, and task load
- **Conversational Style**: Warm, empathetic, like talking to a friend
- **Ultra-Short Responses**: One-sentence, 20-word maximum for quick interactions

### 📊 Dynamic Dashboard
- **Emotion-Based UI**: Color glows and themes adapt to your mood
- **Real-Time Updates**: Live emotion tracking and stress monitoring
- **Task Integration**: Tasks linked to emotional state
- **Activity Feed**: Track daily activities and their mood impact
- **Visual Analytics**: Charts for mood trends, stress levels, and completion rates

### ✅ Smart Task Management
- **Priority Levels**: Low, Medium, High task organization
- **Emotion-Based Suggestions**: AI recommends tasks based on current mood
- **Completion Tracking**: Mark tasks complete and track progress
- **Filter & Sort**: Organize by status, priority, or date
- **Behavior Intelligence**: AI learns your patterns and optimizes suggestions

### 📈 Advanced Analytics
- **Mood Distribution Charts**: Visual breakdown of emotional states
- **Stress Level Trends**: Track stress over time with graphs
- **Completion Rate Analytics**: Monitor task completion patterns
- **Activity Correlation**: See how activities affect your mood
- **Insights Dashboard**: AI-powered recommendations for improvement

## 🎨 UI/UX Experience

### Design Philosophy
- **Dark Futuristic Theme**: Modern glassmorphism with neon accents
- **Mobile-First Responsive**: Optimized for phones, tablets, and desktops
- **Smooth Animations**: 60fps transitions and micro-interactions
- **Accessibility**: WCAG AA compliant with keyboard navigation
- **Intuitive Navigation**: Sidebar with clear visual hierarchy

### Visual Elements
- **Neon Color Palette**: Cyan (#00f5ff), Purple (#bf00ff), Red (#ff0055)
- **Glassmorphism Cards**: Frosted glass effect with backdrop blur
- **Gradient Glows**: Dynamic lighting based on emotional state
- **Animated Indicators**: Pulsing rings, waveforms, and loading states
- **Icon System**: Lucide React icons for consistent iconography

### User Experience
- **One-Click Actions**: Quick emotion detection and task creation
- **Real-Time Feedback**: Instant visual responses to user actions
- **Progressive Disclosure**: Advanced features revealed as needed
- **Error Recovery**: Graceful fallbacks and clear error messages
- **Performance Optimized**: Fast load times and smooth interactions

## 🛠 Tech Stack

### Frontend Framework
- **Next.js 14**: App Router with Server Components
- **React 18**: Hooks and concurrent features
- **TypeScript**: Type safety and better DX

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **Custom CSS**: Glassmorphism effects and animations
- **Lucide React**: Modern icon library
- **Responsive Design**: Mobile-first approach

### Backend & API
- **Supabase**: Authentication, Database, Real-time, Storage
- **Mistral AI**: LLM for chat and suggestions
- **Python (Emotion Backend)**: PyTorch CNN model for emotion detection
- **OpenCV**: Face detection and image processing
- **PyTorch**: Deep learning framework for emotion model

### AI & ML
- **Custom CNN Model**: Trained on FER-2013 dataset
- **Web Speech API**: Browser-native speech recognition
- **Speech Synthesis API**: Browser-native text-to-speech
- **Behavior Intelligence**: Pattern recognition for suggestions

### State Management
- **React Hooks**: useState, useEffect, useRef, useContext
- **Supabase Real-time**: Live data synchronization
- **Local Storage**: Client-side caching for performance

### Development Tools
- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing
- **Git**: Version control
- **Vercel**: Deployment platform

## 📋 Prerequisites

- Node.js 18+ installed
- Python 3.8+ (for emotion backend)
- A Supabase account (free tier works)
- A Mistral AI API key (free tier available)

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/beingcrazyasalways/echo-saas.git
cd echo-saas
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to Settings > API to get your credentials
4. Run the SQL setup script (see `supabase-setup.sql`) in the Supabase SQL Editor

### 4. Set Up Mistral AI

1. Go to [mistral.ai](https://mistral.ai) and create an account
2. Get your API key from the dashboard
3. Add it to your environment variables

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MISTRAL_API_KEY=your_mistral_api_key
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. (Optional) Run Emotion Backend

The emotion detection backend is deployed on Render. To run locally:

```bash
cd emotion-backend
pip install -r requirements.txt
python app.py
```

## 📁 Project Structure

```
/app
  /api/ai-chat/route.js     # Mistral AI chat endpoint
  /dashboard/page.jsx         # Main dashboard with emotion-based UI
  /tasks/page.jsx             # Task management page
  /analytics/page.jsx         # Analytics and insights
  /emotion/page.jsx           # Emotion detection page
  /chat/page.jsx              # AI chat page with Voice Mode
  layout.jsx                  # Root layout with Sidebar
  page.jsx                    # Home page (redirects based on auth)
  globals.css                 # Global styles with glassmorphism

/components
  ChatUI.jsx                  # Chat interface with voice integration
  VoiceMode.jsx               # Full-screen voice mode overlay
  EmotionCamera.jsx           # Camera feed with emotion detection
  Sidebar.jsx                 # Navigation sidebar
  Header.jsx                  # Top header with user info
  TaskList.jsx                # Task list container
  TaskItem.jsx                # Individual task component
  EmotionCard.jsx             # Emotion selection card
  FloatingButton.jsx           # Floating quick-action button
  [10+ more components]

/lib
  supabaseClient.js           # Supabase client and auth functions
  emotionApi.js               # Emotion detection API calls
  tasks.js                    # Task CRUD operations
  emotions.js                 # Emotion logging and retrieval
  aiSuggestions.js            # AI suggestion engine logic
  behavior.js                 # Behavior pattern analysis
  emotionConfig.js            # Emotion styling and configuration
  activities.js               # Activity tracking logic

/emotion-backend
  emotion_model.py            # PyTorch CNN model for emotion detection
  app.py                      # Flask API for emotion detection
  requirements.txt             # Python dependencies
  models/                     # Trained model files
```

## 🗄️ Database Schema

Run the SQL setup script in your Supabase SQL Editor (see `supabase-setup.sql`).

Key tables:
- **users**: User profiles and preferences
- **tasks**: Task management with priority and completion
- **emotions**: Emotion tracking with stress levels
- **activities**: Daily activity logging
- **mood_history**: Historical mood trends

## 🎯 AI Features

### Emotion Detection Model
- **Architecture**: Custom CNN with 3 convolutional blocks
- **Training**: FER-2013 dataset (35,000+ images)
- **Accuracy**: ~65% on test set
- **Inference Time**: <100ms per image
- **Emotions**: 7 classes (angry, disgusted, fearful, happy, neutral, sad, surprised)

### AI Chat Personality
- **Stressed**: Calm, supportive, grounding tone
- **Focused**: Concise, efficient, productivity-driven
- **Sad**: Empathetic, motivational, gentle
- **Happy**: Positive, reinforcing, energetic
- **Calm**: Balanced, helpful, mindful
- **Angry**: Non-judgmental, patient, de-escalating
- **Fearful**: Reassuring, constructive, validating
- **Surprised**: Processing, adaptive, curious

### Behavior Intelligence
- **Pattern Recognition**: Learns from your task completion patterns
- **Time-Based Suggestions**: Recommends tasks based on time of day
- **Mood Correlation**: Links activities to emotional outcomes
- **Stress Prediction**: Anticipates stress based on workload

## 🚢 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy automatically

### Backend (Supabase)
- Already hosted on Supabase cloud
- No additional deployment needed

### Emotion Backend (Render)
- Deployed on Render free tier
- Auto-scaling based on demand
- HTTPS enabled

## 📝 Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `MISTRAL_API_KEY`: Your Mistral AI API key

## 🧪 Testing

The application includes:
- Playwright E2E tests for auth flows
- Manual testing checklist for all features
- Mobile responsive testing
- Voice mode testing on various devices

## 🎨 Design System

- **Theme**: Dark futuristic with neon accents
- **Style**: Glassmorphism cards with backdrop blur
- **Colors**: 
  - Primary: Cyan (#00f5ff)
  - Secondary: Purple (#bf00ff)
  - Accent: Red (#ff0055)
  - Success: Green (#22c55e)
  - Warning: Amber (#f59e0b)
- **Typography**: Inter font family
- **Spacing**: 4px base unit
- **Border Radius**: 8px, 12px, 16px scale
- **Shadows**: Colored glows based on emotion

## 📄 License

This project is part of a Final Capstone Project for E.C.H.O SaaS.

## 🤝 Contributing

This is a capstone project. For questions or feedback, please open an issue.

## 📧 Contact

For inquiries about this project, please contact the development team.
