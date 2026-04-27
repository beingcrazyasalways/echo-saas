'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const EmotionContext = createContext();

export function EmotionProvider({ children }) {
  const [currentEmotion, setCurrentEmotion] = useState('calm');
  const [tasks, setTasks] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Load from localStorage on mount
    const savedEmotion = localStorage.getItem('currentEmotion');
    const savedTasks = localStorage.getItem('tasks');
    const savedSessions = localStorage.getItem('chatSessions');
    
    if (savedEmotion) setCurrentEmotion(savedEmotion);
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedSessions) setSessions(JSON.parse(savedSessions));
  }, []);

  const updateEmotion = (emotion) => {
    setCurrentEmotion(emotion);
    localStorage.setItem('currentEmotion', emotion);
  };

  const addTask = (task) => {
    const newTask = { ...task, id: Date.now(), completed: false };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  const toggleTask = (taskId) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  const deleteTask = (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  const addChatMessage = (message) => {
    setChatHistory(prev => [...prev, message]);
  };

  const saveSession = (messages) => {
    const newSession = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      messages
    };
    
    // Keep only last 3 sessions
    const updatedSessions = [newSession, ...sessions].slice(0, 3);
    setSessions(updatedSessions);
    localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
  };

  const loadSession = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setChatHistory(session.messages);
    }
  };

  return (
    <EmotionContext.Provider value={{ 
      currentEmotion, 
      updateEmotion,
      tasks,
      addTask,
      toggleTask,
      deleteTask,
      chatHistory,
      addChatMessage,
      saveSession,
      loadSession,
      sessions
    }}>
      {children}
    </EmotionContext.Provider>
  );
}

export function useEmotion() {
  const context = useContext(EmotionContext);
  if (!context) {
    throw new Error('useEmotion must be used within EmotionProvider');
  }
  return context;
}
