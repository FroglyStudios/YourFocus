export interface SteamAchievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export interface SteamStatsData {
  hours?: number;
  sessions?: number;
  focusMinutes?: number;
  breaks?: number;
  streak?: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  steamId: string;
}

export interface LeaderboardResult {
  success: boolean;
  leaderboardName: string;
  entries: LeaderboardEntry[];
  currentUser?: string;
  error?: string;
}

declare global {
  interface Window {
    electronAPI?: {
      steam?: {
        isAvailable: () => Promise<{ available: boolean; username?: string; steamId?: string; appId?: number }> | boolean;
        unlockAchievement: (achievementId: string) => Promise<boolean>;
        getStats: () => Promise<{ success: boolean; stats?: SteamStatsData; error?: string }>;
        setStats: (stats: SteamStatsData) => Promise<{ success: boolean; stored?: boolean; error?: string }>;
        getLeaderboard: (name?: string) => Promise<LeaderboardResult>;
        openExternal: (url: string) => Promise<boolean>;
        getWorkshopThemes?: () => Promise<any>;
        uploadWorkshopTheme?: (fileContent: string, title: string, description: string) => Promise<any>;
        getWorkshopSoundPacks?: () => Promise<any>;
        uploadWorkshopSoundPack?: (title: string, description: string, sessionBase64: string, sessionName: string, breakBase64: string, breakName: string) => Promise<any>;
      };
    };
  }
}

class SteamService {
  private achievements: SteamAchievement[] = [];
  private isConnected: boolean = false;
  private currentUsername: string = '';
  private currentSteamId: string = '';

  constructor() {
    this.achievements = [
      { id: 'firstLaunch', name: 'Welcome to YourFocus!', description: "You've opened YourFocus for the first time", unlocked: false },
      { id: 'firstSession', name: 'First Steps', description: 'Completed your first session', unlocked: false },
      { id: 'dedicated', name: 'Dedicated Gamer', description: 'Completed 5 sessions', unlocked: false },
      { id: 'focused', name: 'Focused Player', description: 'Completed 10 sessions', unlocked: false },
      { id: 'master', name: 'Focus Master', description: 'Completed 20 sessions', unlocked: false }
    ];

    this.initConnection();
    this.loadLocalAchievements();
  }

  public async initConnection(): Promise<boolean> {
    try {
      const res = await window.electronAPI?.steam?.isAvailable();
      if (typeof res === 'boolean') {
        this.isConnected = res;
      } else if (res && typeof res === 'object') {
        this.isConnected = Boolean(res.available);
        this.currentUsername = res.username || '';
        this.currentSteamId = res.steamId || '';
      }
      return this.isConnected;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  public isSteamRunning(): boolean {
    return this.isConnected;
  }

  public getUsername(): string {
    return this.currentUsername || 'Steam User';
  }

  public getSteamId(): string {
    return this.currentSteamId;
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
    notification.className = 'fixed top-4 right-4 bg-theme-surface border border-theme-primary text-theme-text p-4 rounded-2xl shadow-2xl z-50 max-w-sm flex items-center gap-3 animate-fade-in';
    notification.innerHTML = `
      <div class="w-10 h-10 bg-theme-primary/20 text-theme-primary rounded-xl flex items-center justify-center text-xl flex-shrink-0">
        🏆
      </div>
      <div>
        <div class="font-bold text-sm text-theme-primary">Steam Achievement Unlocked!</div>
        <div class="text-sm font-semibold">${achievement.name}</div>
        <div class="text-xs text-theme-muted">${achievement.description}</div>
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

  // Steam Stats Synchronization
  public async getSteamStats(): Promise<SteamStatsData | null> {
    try {
      if (!window.electronAPI?.steam?.getStats) return null;
      const res = await window.electronAPI.steam.getStats();
      if (res && res.success && res.stats) {
        return res.stats;
      }
      return null;
    } catch (e) {
      console.warn('[Steam] Failed to fetch stats:', e);
      return null;
    }
  }

  public async setSteamStats(stats: SteamStatsData): Promise<boolean> {
    try {
      if (!window.electronAPI?.steam?.setStats) return false;
      const res = await window.electronAPI.steam.setStats(stats);
      return Boolean(res && res.success);
    } catch (e) {
      console.warn('[Steam] Failed to set stats:', e);
      return false;
    }
  }

  // Leaderboard
  public async getLeaderboard(name: string = 'focus_hours'): Promise<LeaderboardResult> {
    try {
      if (!window.electronAPI?.steam?.getLeaderboard) {
        return {
          success: false,
          leaderboardName: name,
          entries: [],
          currentUser: this.getUsername(),
          error: 'Leaderboard API not available'
        };
      }
      return await window.electronAPI.steam.getLeaderboard(name);
    } catch (e: any) {
      return {
        success: false,
        leaderboardName: name,
        entries: [],
        currentUser: this.getUsername(),
        error: e.message || 'Failed to fetch leaderboard'
      };
    }
  }

  public openLeaderboardInSteam(appId: number = 4037900): void {
    const url = `https://steamcommunity.com/stats/${appId}/leaderboards/`;
    if (window.electronAPI?.steam?.openExternal) {
      window.electronAPI.steam.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  }
}

export const steamService = new SteamService();
