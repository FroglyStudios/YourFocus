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
  }

  addBreak(duration: number): void {
    this.data.stats.totalBreaks += 1;
    this.data.stats.totalBreakTime += duration;
    this.data.stats.streak += 1;
    
    this.saveData();
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
      
      // Trigger Steam achievement if available
      this.triggerSteamAchievement(achievementId);
    }
  }

  private triggerSteamAchievement(achievementId: string): void {
    // Steam Web API integration would go here
    // For now, we'll just log it
    console.log(`Steam Achievement Unlocked: ${achievementId}`);
    
    // In a real implementation, you would call Steam's Web API
    // This requires Steam integration and proper authentication
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