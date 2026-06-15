import React from 'react';
import { Play, Coffee } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface TimerProps {
  timeLeft: number;
  isBreak: boolean;
  isRunning: boolean;
  currentSession: number;
  sessionDuration: number;
  breakDuration: number;
}

const Timer: React.FC<TimerProps> = ({
  timeLeft,
  isBreak,
  isRunning,
  currentSession,
  sessionDuration,
  breakDuration
}) => {
  const { t } = useTranslation();

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    const totalDuration = isBreak ? breakDuration * 60 : sessionDuration * 60;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  const getCircumference = (): number => {
    return 2 * Math.PI * 120; // radius of 120
  };

  const getStrokeDashoffset = (): number => {
    const circumference = getCircumference();
    return circumference - (getProgress() / 100) * circumference;
  };

  return (
    <div className="text-center">
      {/* Session Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {isBreak ? (
          <>
            <Coffee className="w-6 h-6 text-green-600" />
            <span className="text-green-700 font-semibold text-lg">{t('timer.breakTime')}</span>
          </>
        ) : (
          <>
            <Play className="w-6 h-6 text-blue-600" />
            <span className="text-blue-700 font-semibold text-lg">{t('timer.gamingSession')} {currentSession}</span>
          </>
        )}
      </div>

      {/* Circular Progress Timer */}
      <div className="relative inline-block mb-8">
        <svg className="transform -rotate-90 w-64 h-64" viewBox="0 0 256 256">
          {/* Background circle */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-theme-border"
          />
          {/* Progress circle */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={getCircumference()}
            strokeDashoffset={getStrokeDashoffset()}
            className={`transition-all duration-1000 ease-linear ${
              isBreak ? 'text-green-500' : 'text-blue-500'
            }`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Time Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-theme-text mb-2">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-theme-muted font-medium">
              {isBreak ? t('timer.breakRemaining') : t('timer.focusTime')}
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-theme-border'} transition-colors duration-200`}></div>
        <span className="text-theme-muted font-medium">
          {isRunning ? t('timer.active') : t('timer.paused')}
        </span>
      </div>
    </div>
  );
};

export default Timer;