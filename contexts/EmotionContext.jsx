'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const EmotionContext = createContext();

export function EmotionProvider({ children }) {
  const [currentEmotion, setCurrentEmotion] = useState('calm');

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('currentEmotion');
    if (saved) {
      setCurrentEmotion(saved);
    }
  }, []);

  const updateEmotion = (emotion) => {
    setCurrentEmotion(emotion);
    localStorage.setItem('currentEmotion', emotion);
  };

  return (
    <EmotionContext.Provider value={{ currentEmotion, updateEmotion }}>
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
