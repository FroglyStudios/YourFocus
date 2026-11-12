import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTimerCallbacks {
  onSessionComplete?: (duration: number) => void;
  onBreakComplete?: (duration: number) => void;
}

export const useTimer = (
  sessionDuration: number, 
  breakDuration: number,
  callbacks?: UseTimerCallbacks
) => {
  const [timeLeft, setTimeLeft] = useState(sessionDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);

  // Keep latest callbacks in refs to avoid interval tear-down/race conditions
  const callbacksRef = useRef<UseTimerCallbacks | undefined>(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const sessionDurationRef = useRef(sessionDuration);
  useEffect(() => {
    sessionDurationRef.current = sessionDuration;
  }, [sessionDuration]);

  const breakDurationRef = useRef(breakDuration);
  useEffect(() => {
    breakDurationRef.current = breakDuration;
  }, [breakDuration]);

  // Reset timer when durations change while not running
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(isBreak ? breakDuration * 60 : sessionDuration * 60);
    }
  }, [sessionDuration, breakDuration, isBreak, isRunning]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev > 1) {
            return prev - 1;
          }

          // prev is 1 -> timer reaches 0 right now!
          if (isBreak) {
            // Break completed -> notify and reset for next session
            callbacksRef.current?.onBreakComplete?.(breakDurationRef.current);
            setIsBreak(false);
            setIsRunning(false);
            setCurrentSession((s) => s + 1);
            return sessionDurationRef.current * 60;
          } else {
            // Focus session completed -> notify and reset for break
            callbacksRef.current?.onSessionComplete?.(sessionDurationRef.current);
            setIsBreak(true);
            setIsRunning(false);
            return breakDurationRef.current * 60;
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isBreak]);

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
