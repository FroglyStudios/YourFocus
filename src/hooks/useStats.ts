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
        const stats = dataService.getStats();

        // Beispiel: unlocke "firstSession" wenn der Benutzer seine erste Session absolviert
        if (stats.totalSessions === 1) {
          console.log('Unlocking firstSession achievement...');
          steamService.unlockAchievement('firstSession');
        }

        // Beispiel: unlocke „focusMaster“ nach 10 Sessions
        if (stats.totalSessions === 10) {
          console.log('Unlocking focusMaster achievement...');
          steamService.unlockAchievement('focusMaster');
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
