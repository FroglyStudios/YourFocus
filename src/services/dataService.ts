import { steamService } from './steamService';

interface UserData {
  stats: {
    totalSessions: number;
    totalFocusTime: number;
    totalBreaks: number;
    totalBreakTime: number;
    streak: number;
    todaySessions: number;
    lastSessionDate: string;
    achievements: string[];
    firstLaunch: boolean;
  };
  settings: {
    sessionDuration: number;
    breakDuration: number;
    soundEnabled: boolean;
    language: string;
    customSessionSound?: string;
    customBreakSound?: string;
    activeSoundPackId?: string;
  };
}

class DataService {
  private readonly STORAGE_KEY = 'yourfocus-data';
  private data: UserData;

  constructor() {
    this.data = this.loadData();
  }

  private getDefaultData(): UserData {
    return {
      stats: {
        totalSessions: 0,
        totalFocusTime: 0,
        totalBreaks: 0,
        totalBreakTime: 0,
        streak: 0,
        todaySessions: 0,
        lastSessionDate: '',
        achievements: [],
        firstLaunch: true
      },
      settings: {
        sessionDuration: 90,
        breakDuration: 10,
        soundEnabled: true,
        language: 'en'
      }
    };
  }

  private loadData(): UserData {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Reset today's sessions if it's a new day
        const today = new Date().toDateString();
        if (parsedData.stats?.lastSessionDate !== today) {
          parsedData.stats.todaySessions = 0;
        }
        
        // Merge with default data to ensure all properties exist
        return { ...this.getDefaultData(), ...parsedData };
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
    }
    
    return this.getDefaultData();
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
      
      // Also save as downloadable JSON for backup
      this.generateDataFile();
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }

  private generateDataFile(): void {
    try {
      const dataBlob = new Blob([JSON.stringify(this.data, null, 2)], {
        type: 'application/json'
      });
      
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(dataBlob);
      
      // Store the URL for potential download
      (window as any).yourFocusDataUrl = url;
    } catch (error) {
      console.error('Failed to generate data file:', error);
    }
  }

  // Stats methods
  getStats() {
    return { ...this.data.stats };
  }

  public async syncWithSteam(): Promise<UserData['stats']> {
    try {
      const isOnline = await steamService.initConnection();
      if (!isOnline) return this.getStats();

      const steamStats = await steamService.getSteamStats();
      if (!steamStats) return this.getStats();

      let hasLocalUpdate = false;
      const hoursInMinutes = (steamStats.hours || 0) * 60;
      const steamFocusTime = Math.max(hoursInMinutes, steamStats.focusMinutes || 0);

      // If Steam has higher values, adopt them
      if (steamFocusTime > this.data.stats.totalFocusTime) {
        this.data.stats.totalFocusTime = steamFocusTime;
        hasLocalUpdate = true;
      }
      if ((steamStats.sessions || 0) > this.data.stats.totalSessions) {
        this.data.stats.totalSessions = steamStats.sessions || 0;
        hasLocalUpdate = true;
      }
      if ((steamStats.breaks || 0) > this.data.stats.totalBreaks) {
        this.data.stats.totalBreaks = steamStats.breaks || 0;
        hasLocalUpdate = true;
      }
      if ((steamStats.streak || 0) > this.data.stats.streak) {
        this.data.stats.streak = steamStats.streak || 0;
        hasLocalUpdate = true;
      }

      if (hasLocalUpdate) {
        this.saveData();
      }

      // Push highest merged values back to Steam
      const totalHours = Math.floor(this.data.stats.totalFocusTime / 60);
      await steamService.setSteamStats({
        hours: totalHours,
        sessions: this.data.stats.totalSessions,
        focusMinutes: this.data.stats.totalFocusTime,
        breaks: this.data.stats.totalBreaks,
        streak: this.data.stats.streak
      });

      return this.getStats();
    } catch (e) {
      console.warn('[DataService] Steam sync failed:', e);
      return this.getStats();
    }
  }

  addSession(duration: number): void {
    const today = new Date().toDateString();
    
    this.data.stats.totalSessions += 1;
    this.data.stats.totalFocusTime += duration;
    this.data.stats.todaySessions = this.data.stats.lastSessionDate === today 
      ? this.data.stats.todaySessions + 1 
      : 1;
    this.data.stats.lastSessionDate = today;
    
    // Check for achievements
    this.checkSessionAchievements();
    
    this.saveData();

    // Push stats immediately to Steam in background
    const totalHours = Math.floor(this.data.stats.totalFocusTime / 60);
    steamService.setSteamStats({
      hours: totalHours,
      sessions: this.data.stats.totalSessions,
      focusMinutes: this.data.stats.totalFocusTime
    }).catch(() => {});
  }

  addBreak(duration: number): void {
    this.data.stats.totalBreaks += 1;
    this.data.stats.totalBreakTime += duration;
    this.data.stats.streak += 1;
    
    this.saveData();

    // Push break & streak stats immediately to Steam
    steamService.setSteamStats({
      breaks: this.data.stats.totalBreaks,
      streak: this.data.stats.streak
    }).catch(() => {});
  }

  resetStreak(): void {
    this.data.stats.streak = 0;
    this.saveData();
  }

  // Settings methods
  getSettings() {
    return { ...this.data.settings };
  }

  updateSettings(newSettings: Partial<UserData['settings']>): void {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.saveData();
  }

  // Achievement methods
  private checkSessionAchievements(): void {
    const achievements = this.data.stats.achievements;
    const sessions = this.data.stats.totalSessions;
    
    if (sessions >= 1 && !achievements.includes('firstSession')) {
      this.unlockAchievement('firstSession');
    }
    if (sessions >= 5 && !achievements.includes('dedicated')) {
      this.unlockAchievement('dedicated');
    }
    if (sessions >= 10 && !achievements.includes('focused')) {
      this.unlockAchievement('focused');
    }
    if (sessions >= 20 && !achievements.includes('master')) {
      this.unlockAchievement('master');
    }
  }

  unlockAchievement(achievementId: string): void {
    if (!this.data.stats.achievements.includes(achievementId)) {
      this.data.stats.achievements.push(achievementId);
      this.saveData();
      
      // Trigger Steam achievement
      this.triggerSteamAchievement(achievementId);
    }
  }

  private triggerSteamAchievement(achievementId: string): void {
    steamService.unlockAchievement(achievementId).catch(err => {
      console.warn(`[DataService] Achievement unlock error: ${achievementId}`, err);
    });
  }

  markFirstLaunch(): void {
    if (this.data.stats.firstLaunch) {
      this.data.stats.firstLaunch = false;
      this.unlockAchievement('firstLaunch');
    }
  }

  // Export/Import methods
  exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData);
      
      // Validate the data structure
      if (importedData.stats && importedData.settings) {
        this.data = { ...this.getDefaultData(), ...importedData };
        this.saveData();
        return true;
      }
    } catch (error) {
      console.error('Failed to import data:', error);
    }
    
    return false;
  }

  // Download data file
  downloadData(): void {
    const dataStr = this.exportData();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `yourfocus-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

export const dataService = new DataService();