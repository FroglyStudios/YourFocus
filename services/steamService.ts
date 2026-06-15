interface SteamAchievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

declare global {
  interface Window {
    electronAPI?: {
      steam?: {
        isAvailable: () => boolean;
        unlockAchievement: (achievementId: string) => Promise<boolean>;
      };
    };
  }
}

class SteamService {
  private achievements: SteamAchievement[] = [];
  private isConnected: boolean = false;

  constructor() {
    this.achievements = [
      { id: 'firstLaunch', name: 'Welcome to YourFocus!', description: "You've opened YourFocus for the first time", unlocked: false },
      { id: 'firstSession', name: 'First Steps', description: 'Completed your first session', unlocked: false },
      { id: 'dedicated', name: 'Dedicated Gamer', description: 'Completed 5 sessions', unlocked: false },
      { id: 'focused', name: 'Focused Player', description: 'Completed 10 sessions', unlocked: false },
      { id: 'master', name: 'Focus Master', description: 'Completed 20 sessions', unlocked: false }
    ];

    this.isConnected = window.electronAPI?.steam?.isAvailable() || false;
    this.loadLocalAchievements();
  }

  public isSteamRunning(): boolean {
    return this.isConnected;
  }

  private loadLocalAchievements(): void {
    try {
      const saved = localStorage.getItem('steam-achievements');
      if (saved) {
        const unlockedIds = JSON.parse(saved);
        this.achievements.forEach(achievement => {
          achievement.unlocked = unlockedIds.includes(achievement.id);
        });
      }
    } catch (error) {
      console.error('[Steam] Failed to load local achievements:', error);
    }
  }

  public async unlockAchievement(achievementId: string): Promise<boolean> {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement) {
      console.error(`[Steam] Achievement not found: ${achievementId}`);
      return false;
    }

    if (achievement.unlocked) {
      console.log(`[Steam] Achievement already unlocked: ${achievementId}`);
      return true;
    }

    try {
      if (this.isConnected && window.electronAPI?.steam) {
        await window.electronAPI.steam.unlockAchievement(achievementId);
        console.log(`[Steam] Achievement unlocked via IPC: ${achievementId}`);
      }

      achievement.unlocked = true;
      this.saveAchievements();
      this.showAchievementNotification(achievement);
      return true;
    } catch (error) {
      console.error(`[Steam] Failed to unlock achievement ${achievementId}:`, error);
      return false;
    }
  }

  private saveAchievements(): void {
    const unlockedIds = this.achievements.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem('steam-achievements', JSON.stringify(unlockedIds));
  }

  private showAchievementNotification(achievement: SteamAchievement): void {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
          🏆
        </div>
        <div>
          <div class="font-bold">Achievement Unlocked!</div>
          <div class="text-sm">${achievement.name}</div>
          <div class="text-xs opacity-90">${achievement.description}</div>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  }

  public getAchievements(): SteamAchievement[] {
    return [...this.achievements];
  }

  public getUnlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }

  public getTotalCount(): number {
    return this.achievements.length;
  }
}

export const steamService = new SteamService();
