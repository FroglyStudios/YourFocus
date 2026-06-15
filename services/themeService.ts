export interface Theme {
  name: string;
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

class ThemeService {
  private activeTheme: Theme | null = null;
  private isDarkMode: boolean = true;

  constructor() {
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
}

export const themeService = new ThemeService();
