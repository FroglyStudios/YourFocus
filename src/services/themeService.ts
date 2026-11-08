export interface Theme {
  name: string;
  workshopId?: string;
  description?: string;
  author?: string;
  colors: {
    '--theme-bg': string;
    '--theme-surface': string;
    '--theme-border': string;
    '--theme-text': string;
    '--theme-muted': string;
    '--theme-primary': string;
    '--theme-primary-hover': string;
  };
}

export interface WorkshopStatus {
  available: boolean;
  username?: string;
  appId?: number;
}

export interface WorkshopThemesResult {
  themes: Theme[];
  isSteamRunning: boolean;
  username?: string;
  error?: string;
}

export interface WorkshopUploadResult {
  success: boolean;
  itemId?: string;
  needsAgreement?: boolean;
  error?: string;
}

class ThemeService {
  private activeTheme: Theme | null = null;
  private isDarkMode: boolean = true;

  constructor() {
    // We will initialize explicitly to ensure DOM is fully ready
  }

  public init() {
    this.loadSavedTheme();
    this.loadSavedMode();
  }

  public setDarkMode(isDark: boolean) {
    this.isDarkMode = isDark;
    localStorage.setItem('yourfocus-darkmode', isDark ? 'true' : 'false');
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  public getDarkMode(): boolean {
    return this.isDarkMode;
  }

  private loadSavedMode() {
    const saved = localStorage.getItem('yourfocus-darkmode');
    if (saved === 'false') {
      this.setDarkMode(false);
    } else {
      this.setDarkMode(true); // Default to true
    }
  }

  private loadSavedTheme() {
    try {
      const saved = localStorage.getItem('yourfocus-theme');
      if (saved) {
        const theme: Theme = JSON.parse(saved);
        this.applyTheme(theme);
      }
    } catch (e) {
      console.error('Failed to load saved theme', e);
    }
  }

  public applyTheme(theme: Theme | null) {
    if (!theme) {
      // Reset to default by removing inline styles
      const root = document.documentElement;
      const vars = [
        '--theme-bg', '--theme-surface', '--theme-border', 
        '--theme-text', '--theme-muted', '--theme-primary', '--theme-primary-hover'
      ];
      vars.forEach(v => root.style.removeProperty(v));
      this.activeTheme = null;
      localStorage.removeItem('yourfocus-theme');
      return;
    }

    this.activeTheme = theme;
    localStorage.setItem('yourfocus-theme', JSON.stringify(theme));
    
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }

  public getActiveTheme(): Theme | null {
    return this.activeTheme;
  }

  public async importThemeFromFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const theme: Theme = JSON.parse(content);
          
          if (theme.colors && theme.colors['--theme-bg']) {
            this.applyTheme(theme);
            resolve(true);
          } else {
            console.error('Invalid theme format');
            resolve(false);
          }
        } catch (err) {
          console.error('Error parsing theme file', err);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }

  public async getSteamStatus(): Promise<WorkshopStatus> {
    const win = window as any;
    if (win.electronAPI && win.electronAPI.steam && win.electronAPI.steam.isAvailable) {
      try {
        const res = await win.electronAPI.steam.isAvailable();
        if (typeof res === 'boolean') {
          return { available: res };
        }
        return res || { available: false };
      } catch {
        return { available: false };
      }
    }
    return { available: false };
  }

  public async fetchWorkshopThemes(): Promise<WorkshopThemesResult> {
    const win = window as any;
    if (win.electronAPI && win.electronAPI.steam) {
      try {
        const res = await win.electronAPI.steam.getWorkshopThemes();
        if (Array.isArray(res)) {
          const status = await this.getSteamStatus();
          return { themes: res, isSteamRunning: status.available, username: status.username };
        }
        return {
          themes: res.themes || [],
          isSteamRunning: Boolean(res.isSteamRunning),
          username: res.username,
          error: res.error
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('Failed to fetch workshop themes', err);
        return { themes: [], isSteamRunning: false, error: errorMsg };
      }
    }
    return { themes: [], isSteamRunning: false, error: 'Steam API not available' };
  }

  public async uploadToWorkshop(file: File, title: string, description: string): Promise<WorkshopUploadResult> {
    return new Promise((resolve) => {
      const win = window as any;
      if (!win.electronAPI || !win.electronAPI.steam) {
        resolve({ success: false, error: "Steam API not available. Is the desktop app running?" });
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          if (!content) {
             resolve({ success: false, error: "File content is empty." });
             return;
          }
          const result = await win.electronAPI.steam.uploadWorkshopTheme(content, title, description);
          if (result && typeof result === 'object') {
            resolve({ 
              success: Boolean(result.success), 
              itemId: result.itemId,
              needsAgreement: Boolean(result.needsToAcceptAgreement) 
            });
          } else {
            resolve({ success: true });
          }
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error('Failed to upload workshop theme', err);
          resolve({ success: false, error: errorMsg });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, error: "Failed to read file contents." });
      };
      reader.readAsText(file);
    });
  }

  public openExternal(url: string) {
    const win = window as any;
    if (win.electronAPI && win.electronAPI.steam && win.electronAPI.steam.openExternal) {
      win.electronAPI.steam.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

export const themeService = new ThemeService();
