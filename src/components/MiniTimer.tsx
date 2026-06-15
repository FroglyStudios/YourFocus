import React, { useEffect, useState } from 'react';
import { Maximize2, Play, Coffee } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface TimerState {
  timeLeft: number;
  isBreak: boolean;
  isRunning: boolean;
}

const MiniTimer: React.FC = () => {
  const { t } = useTranslation();
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: 0,
    isBreak: false,
    isRunning: false
  });

  useEffect(() => {
    // Listen for timer updates from the main window via IPC
    const win = window as any;
    if (win.electronAPI && win.electronAPI.mini) {
      win.electronAPI.mini.onTimerUpdate((state: TimerState) => {
        setTimerState(state);
      });
    }
  }, []);

  const handleRestore = () => {
    const win = window as any;
    if (win.electronAPI && win.electronAPI.mini) {
      win.electronAPI.mini.close();
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-screen bg-theme-surface/80 backdrop-blur-md flex items-center justify-between px-4 overflow-hidden" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl shadow-lg ${timerState.isBreak ? 'bg-green-500/20 text-green-500' : 'bg-theme-primary/20 text-theme-primary'}`}>
          {timerState.isBreak ? <Coffee className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-2xl font-bold text-theme-text font-mono leading-none tracking-tight">
            {formatTime(timerState.timeLeft)}
          </span>
          <span className="text-[10px] text-theme-muted uppercase tracking-wider font-semibold mt-0.5">
            {timerState.isBreak ? t('timer.breakRemaining') || 'Break' : t('timer.focusTime') || 'Focus'}
            {!timerState.isRunning && ' (Paused)'}
          </span>
        </div>
      </div>
      
      <button 
        onClick={handleRestore}
        className="p-2 text-theme-muted hover:text-theme-text hover:bg-theme-border/50 rounded-xl transition-all"
        style={{ WebkitAppRegion: 'no-drag' } as any}
        title="Restore Main Window"
      >
        <Maximize2 className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MiniTimer;
