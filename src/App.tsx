import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Settings as SettingsIcon, Eye, Activity, Clock, Trophy } from 'lucide-react';
import Timer from './components/Timer';
import Settings from './components/Settings';
import ExerciseModal from './components/ExerciseModal';
import Statistics from './components/Statistics';
import { useTimer } from './hooks/useTimer';
import { useNotifications } from './hooks/useNotifications';
import { useStats } from './hooks/useStats';
import { useTranslation } from './hooks/useTranslation';
import { dataService } from './services/dataService';
import { discordService } from './services/discordService';

import { themeService } from './services/themeService';

function App() {
  const { t, isLoaded } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // Load settings from data service
  const [settings, setSettings] = useState(dataService.getSettings());
  const { sessionDuration, breakDuration, soundEnabled } = settings;

  const {
    timeLeft,
    isRunning,
    isBreak,
    currentSession,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak,
    skipToSession
  } = useTimer(sessionDuration, breakDuration);

  const { requestPermission, showNotification } = useNotifications();
  const { stats, addSession, addBreak } = useStats();

  // Request notification permission on first load
  useEffect(() => {
    requestPermission();
    
    // Initialize Discord Rich Presence
    discordService.setActivity({
      details: t('app.title'),
      state: 'Ready to focus',
      largeImageKey: 'yourfocus_logo',
      largeImageText: t('app.subtitle')
    });
  }, [requestPermission]);

  // Update Discord activity when timer state changes
  useEffect(() => {
    if (isRunning) {
      if (isBreak) {
        discordService.startBreak(breakDuration);
      } else {
        discordService.startSession(sessionDuration, currentSession);
      }
    } else {
      discordService.pauseSession();
    }
  }, [isRunning, isBreak, sessionDuration, breakDuration, currentSession]);

  // Update Discord activity with real-time countdown
  useEffect(() => {
    if (isRunning) {
      discordService.updateSessionActivity(isBreak, timeLeft, currentSession);
    }
  }, [isRunning, isBreak, timeLeft, currentSession]);

  // Sync state to Mini-Overlay
  useEffect(() => {
    const win = window as any;
    if (win.electronAPI && win.electronAPI.mini) {
      win.electronAPI.mini.updateTimer({ timeLeft, isBreak, isRunning });
    }
  }, [timeLeft, isBreak, isRunning]);

  // Handle timer completion
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      if (isBreak) {
        showNotification(
          t('notifications.breakComplete'),
          t('notifications.breakCompleteBody'),
          'session'
        );
        addSession(sessionDuration);
        if (soundEnabled) {
          playSound('session');
        }
      } else {
        showNotification(
          t('notifications.sessionComplete'),
          t('notifications.sessionCompleteBody'),
          'break'
        );
        addBreak(breakDuration);
        setShowExercises(true);
        if (soundEnabled) {
          playSound('break');
        }
      }
    }
  }, [timeLeft, isRunning, isBreak, showNotification, sessionDuration, breakDuration, soundEnabled, addSession, addBreak, t]);

  const playSound = (type: 'session' | 'break') => {
    const audio = new Audio();
    if (type === 'break') {
      // Gentle chime for break time, or custom sound
      audio.src = settings.customBreakSound || 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBg==';
    } else {
      // Subtle bell for session time, or custom sound
      audio.src = settings.customSessionSound || 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBg==';
    }
    audio.play().catch(() => {
      // Ignore errors if audio can't play
    });
  };

  const handleSettingsSave = useCallback((settings: { sessionDuration: number; breakDuration: number; soundEnabled: boolean }) => {
    dataService.updateSettings(settings);
    setSettings(dataService.getSettings());
    setShowSettings(false);
  }, []);

  // Load settings from data service on mount
  useEffect(() => {
    setSettings(dataService.getSettings());
  }, []);

  // Don't render until translations are loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto mb-4"></div>
          <p className="text-theme-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-theme-primary p-3 rounded-2xl shadow-lg shadow-theme-primary/20">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-theme-text">{t('app.title')}</h1>
          </div>
          <p className="text-theme-muted text-lg max-w-md mx-auto">
            {t('app.subtitle')}
          </p>
        </div>

        {/* Main Timer Card */}
        <div className="max-w-2xl mx-auto">
          <div className="glass-panel rounded-3xl p-8 mb-8">
            <Timer 
              timeLeft={timeLeft}
              isBreak={isBreak}
              isRunning={isRunning}
              currentSession={currentSession}
              sessionDuration={sessionDuration}
              breakDuration={breakDuration}
            />
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
              {!isRunning ? (
                <button
                  onClick={startTimer}
                  className="bg-theme-primary hover:bg-theme-primaryHover text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg shadow-theme-primary/20 flex items-center gap-3 text-lg"
                >
                  <Play className="w-5 h-5" />
                  {t('controls.startFocus')}
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3 text-lg"
                >
                  <Pause className="w-5 h-5" />
                  {t('controls.pause')}
                </button>
              )}
              
              <button
                onClick={resetTimer}
                className="bg-theme-bg border border-theme-border text-theme-text hover:bg-theme-border px-6 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg flex items-center gap-3"
              >
                <Square className="w-5 h-5" />
                {t('controls.reset')}
              </button>
            </div>

            {/* Quick Actions */}
            {isRunning && (
              <div className="flex items-center justify-center gap-3 mt-6">
                {!isBreak ? (
                  <button
                    onClick={skipToBreak}
                    className="text-theme-primary hover:text-theme-primaryHover font-medium transition-colors duration-200 flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    {t('controls.takeBreakNow')}
                  </button>
                ) : (
                  <button
                    onClick={skipToSession}
                    className="text-theme-primary hover:text-theme-primaryHover font-medium transition-colors duration-200 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {t('controls.backToGaming')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="glass-panel hover:bg-theme-bg text-theme-text p-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 font-medium"
            >
              <SettingsIcon className="w-5 h-5" />
              {t('buttons.settings')}
            </button>
            
            <button
              onClick={() => setShowExercises(true)}
              className="glass-panel hover:bg-theme-bg text-theme-text p-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 font-medium"
            >
              <Eye className="w-5 h-5" />
              {t('buttons.exercises')}
            </button>
            
            <button
              onClick={() => setShowStats(true)}
              className="glass-panel hover:bg-theme-bg text-theme-text p-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 font-medium"
            >
              <Trophy className="w-5 h-5" />
              {t('buttons.statistics')}
            </button>

            <button
              onClick={() => {
                const win = window as any;
                if (win.electronAPI && win.electronAPI.mini) {
                  win.electronAPI.mini.toggle();
                }
              }}
              className="glass-panel hover:bg-theme-bg text-theme-primary p-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 font-medium border border-theme-primary/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><rect width="9" height="7" x="12" y="12" rx="1"/></svg>
              Mini Mode
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSettings && (
        <Settings
          sessionDuration={sessionDuration}
          breakDuration={breakDuration}
          soundEnabled={soundEnabled}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {showExercises && (
        <ExerciseModal onClose={() => setShowExercises(false)} />
      )}
      
      {showStats && (
        <Statistics
          stats={stats}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}

export default App;