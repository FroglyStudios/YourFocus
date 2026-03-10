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
      // Gentle chime for break time
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBg==';
    } else {
      // Subtle bell for session time
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBjiN2/LNeSsFJHfE8N2QQAoUXrTp66hVFApGn+DyvmgbBg==';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800">{t('app.title')}</h1>
          </div>
          <p className="text-slate-600 text-lg max-w-md mx-auto">
            {t('app.subtitle')}
          </p>
        </div>

        {/* Main Timer Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-slate-100">
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3 text-lg"
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
                className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3"
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
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    {t('controls.takeBreakNow')}
                  </button>
                ) : (
                  <button
                    onClick={skipToSession}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {t('controls.backToGaming')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 font-medium"
            >
              <SettingsIcon className="w-5 h-5" />
              {t('buttons.settings')}
            </button>
            
            <button
              onClick={() => setShowExercises(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 font-medium"
            >
              <Eye className="w-5 h-5" />
              {t('buttons.exercises')}
            </button>
            
            <button
              onClick={() => setShowStats(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 font-medium"
            >
              <Trophy className="w-5 h-5" />
              {t('buttons.statistics')}
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