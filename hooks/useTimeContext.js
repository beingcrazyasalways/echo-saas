import { useState, useEffect } from 'react';

export function useTimeContext() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionStartTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hour = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  const getTimeOfDay = () => {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  };

  const getGreeting = (name = 'User') => {
    const timeOfDay = getTimeOfDay();
    switch (timeOfDay) {
      case 'morning':
        return `Good morning, ${name}`;
      case 'afternoon':
        return `Good afternoon, ${name}`;
      case 'evening':
        return `Good evening, ${name}`;
      case 'night':
        return `Working late, ${name}? 👀`;
      default:
        return `Hello, ${name}`;
    }
  };

  const getFormattedTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getFormattedDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDayOfWeek = () => {
    return currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getSessionDuration = () => {
    const diff = currentTime - sessionStartTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  return {
    currentTime,
    hour,
    minutes,
    seconds,
    timeOfDay: getTimeOfDay(),
    greeting: getGreeting(),
    formattedTime: getFormattedTime(),
    formattedDate: getFormattedDate(),
    dayOfWeek: getDayOfWeek(),
    sessionDuration: getSessionDuration(),
    sessionStartTime
  };
}
