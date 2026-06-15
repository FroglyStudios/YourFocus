import { useState, useEffect, useCallback } from 'react';

export const useTimer = (sessionDuration: number, breakDuration: number) => {
  const [timeLeft, setTimeLeft] = useState(sessionDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);

  // Reset timer when durations change
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(isBreak ? breakDuration * 60 : sessionDuration * 60);
    }
  }, [sessionDuration, breakDuration, isBreak, isRunning]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Timer completed
      setIsRunning(false);
      if (isBreak) {
        // Break completed, start new session
        setIsBreak(false);
        setCurrentSession(prev => prev + 1);
        setTimeLeft(sessionDuration * 60);
      } else {
        // Session completed, start break
        setIsBreak(true);
        setTimeLeft(breakDuration * 60);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, isBreak, sessionDuration, breakDuration]);

  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    setCurrentSession(1);
    setTimeLeft(sessionDuration * 60);
  }, [sessionDuration]);

  const skipToBreak = useCallback(() => {
    setIsBreak(true);
    setTimeLeft(breakDuration * 60);
    setIsRunning(true);
  }, [breakDuration]);

  const skipToSession = useCallback(() => {
    setIsBreak(false);
    setCurrentSession(prev => prev + 1);
    setTimeLeft(sessionDuration * 60);
    setIsRunning(true);
  }, [sessionDuration]);

  return {
    timeLeft,
    isRunning,
    isBreak,
    currentSession,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak,
    skipToSession
  };
};