import { useState, useCallback, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { steamService } from '../services/steamService';

export const useStats = () => {
  const [stats, setStats] = useState(dataService.getStats());

  useEffect(() => {
    setStats(dataService.getStats());
  }, []);

  const addSession = useCallback((duration: number) => {
    dataService.addSession(duration);
    setStats(dataService.getStats());

    // Achievement-Check nach Session-Start
    try {
      if (steamService?.isSteamRunning()) {
        const currentStats = dataService.getStats();

        // Unlock "firstSession" after 1 session
        if (currentStats.totalSessions === 1) {
          console.log('Unlocking firstSession achievement...');
          steamService.unlockAchievement('firstSession');
        }
        
        // Unlock "dedicated" after 5 sessions
        if (currentStats.totalSessions === 5) {
          console.log('Unlocking dedicated achievement...');
          steamService.unlockAchievement('dedicated');
        }

        // Unlock "focused" after 10 sessions
        if (currentStats.totalSessions === 10) {
          console.log('Unlocking focused achievement...');
          steamService.unlockAchievement('focused');
        }
        
        // Unlock "master" after 20 sessions
        if (currentStats.totalSessions === 20) {
          console.log('Unlocking master achievement...');
          steamService.unlockAchievement('master');
        }
      }
    } catch (e) {
      console.error('Achievement check failed:', e);
    }
  }, []);

  const addBreak = useCallback((duration: number) => {
    dataService.addBreak(duration);
    setStats(dataService.getStats());
  }, []);

  const resetStreak = useCallback(() => {
    dataService.resetStreak();
    setStats(dataService.getStats());
  }, []);

  const downloadData = useCallback(() => {
    dataService.downloadData();
  }, []);

  const importData = useCallback((jsonData: string) => {
    const success = dataService.importData(jsonData);
    if (success) {
      setStats(dataService.getStats());
    }
    return success;
  }, []);

  return { 
    stats, 
    addSession, 
    addBreak, 
    resetStreak, 
    downloadData, 
    importData 
  };
};
