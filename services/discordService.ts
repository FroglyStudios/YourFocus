interface DiscordActivity {
  details?: string;
  state?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  partyId?: string;
  partySize?: number;
  partyMax?: number;
  matchSecret?: string;
  joinSecret?: string;
  spectateSecret?: string;
  instance?: boolean;
}

class DiscordService {
  private rpc: any = null;
  private isConnected: boolean = false;
  private currentActivity: DiscordActivity | null = null;
  private sessionStartTime: number = 0;
  private readonly clientId: string = '1415852599919378562';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.initializeDiscord();
  }

  private async initializeDiscord(): Promise<void> {
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        console.log('Initializing Discord RPC in Electron environment');
        await this.initializeElectronRPC();
      } else {
        console.log('Not in Electron environment, Discord RPC unavailable');
      }
    } catch (error) {
      console.error('Failed to initialize Discord RPC:', error);
      this.scheduleReconnect();
    }
  }

  private async initializeElectronRPC(): Promise<void> {
    try {
      const electronAPI = (window as any).electronAPI;
      
      // Try to connect through Electron
      const connected = await electronAPI.discord.connect(this.clientId);
      
      if (connected) {
        console.log('Discord RPC connected successfully via Electron');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Set initial activity
        await this.setActivity({
          details: 'Using YourFocus',
          state: 'Ready to focus',
          largeImageKey: 'yourfocus_logo',
          largeImageText: 'YourFocus - Gaming Focus Timer',
          startTimestamp: Date.now()
        });
      } else {
        throw new Error('Failed to connect to Discord via Electron');
      }
    } catch (error) {
      console.error('Electron Discord RPC connection failed:', error);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Scheduling Discord RPC reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        this.initializeDiscord();
      }, delay);
    } else {
      console.log('Max Discord RPC reconnect attempts reached');
    }
  }

  async setActivity(activity: DiscordActivity): Promise<void> {
    if (!this.isConnected) {
      console.log('Discord RPC not connected, activity update skipped');
      return;
    }

    try {
      this.currentActivity = activity;
      
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.discord) {
        await electronAPI.discord.setActivity({
          details: activity.details,
          state: activity.state,
          startTimestamp: activity.startTimestamp,
          endTimestamp: activity.endTimestamp,
          largeImageKey: activity.largeImageKey || 'yourfocus_logo',
          largeImageText: activity.largeImageText || 'YourFocus - Gaming Focus Timer',
          smallImageKey: activity.smallImageKey,
          smallImageText: activity.smallImageText,
          instance: activity.instance || false
        });
        
        console.log('Discord activity updated:', activity);
      }
    } catch (error) {
      console.error('Failed to set Discord activity:', error);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  async updateSessionActivity(isBreak: boolean, timeLeft: number, currentSession: number): Promise<void> {
    if (!this.isConnected) return;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const activity: DiscordActivity = {
      details: isBreak ? '☕ Taking a break' : `🎮 Gaming Session ${currentSession}`,
      state: isBreak 
        ? `${timeString} break remaining` 
        : `${timeString} focus time left`,
      largeImageKey: 'yourfocus_logo',
      largeImageText: 'YourFocus - Gaming Focus Timer',
      smallImageKey: isBreak ? 'break_icon' : 'focus_icon',
      smallImageText: isBreak ? 'Break Time' : 'Focus Time',
      startTimestamp: this.sessionStartTime || Date.now(),
      endTimestamp: Date.now() + (timeLeft * 1000)
    };

    await this.setActivity(activity);
  }

  async startSession(sessionDuration: number, currentSession: number): Promise<void> {
    this.sessionStartTime = Date.now();
    
    const activity: DiscordActivity = {
      details: `🎮 Gaming Session ${currentSession}`,
      state: `${sessionDuration} minutes of focused gaming`,
      largeImageKey: 'yourfocus_logo',
      largeImageText: 'YourFocus - Gaming Focus Timer',
      smallImageKey: 'focus_icon',
      smallImageText: 'Focus Time',
      startTimestamp: this.sessionStartTime,
      endTimestamp: this.sessionStartTime + (sessionDuration * 60 * 1000)
    };

    await this.setActivity(activity);
  }

  async startBreak(breakDuration: number): Promise<void> {
    const breakStartTime = Date.now();
    
    const activity: DiscordActivity = {
      details: '☕ Taking a healthy break',
      state: `${breakDuration} minutes of rest and exercises`,
      largeImageKey: 'yourfocus_logo',
      largeImageText: 'YourFocus - Gaming Focus Timer',
      smallImageKey: 'break_icon',
      smallImageText: 'Break Time',
      startTimestamp: breakStartTime,
      endTimestamp: breakStartTime + (breakDuration * 60 * 1000)
    };

    await this.setActivity(activity);
  }

  async pauseSession(): Promise<void> {
    if (!this.isConnected) return;

    const activity: DiscordActivity = {
      details: '⏸️ Session paused',
      state: 'Taking a moment',
      largeImageKey: 'yourfocus_logo',
      largeImageText: 'YourFocus - Gaming Focus Timer',
      smallImageKey: 'pause_icon',
      smallImageText: 'Paused',
      startTimestamp: Date.now()
    };

    await this.setActivity(activity);
  }

  async endSession(): Promise<void> {
    if (!this.isConnected) return;

    const activity: DiscordActivity = {
      details: '✅ Session complete',
      state: 'Ready for next session',
      largeImageKey: 'yourfocus_logo',
      largeImageText: 'YourFocus - Gaming Focus Timer',
      smallImageKey: 'complete_icon',
      smallImageText: 'Complete',
      startTimestamp: Date.now()
    };

    await this.setActivity(activity);
  }

  async clearActivity(): Promise<void> {
    if (!this.isConnected) return;

    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.discord) {
        await electronAPI.discord.clearActivity();
        this.currentActivity = null;
        console.log('Discord activity cleared');
      }
    } catch (error) {
      console.error('Failed to clear Discord activity:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.clearActivity();
        this.isConnected = false;
        console.log('Discord RPC disconnected');
      } catch (error) {
        console.error('Failed to disconnect Discord RPC:', error);
      }
    }
  }

  isDiscordConnected(): boolean {
    return this.isConnected;
  }

  getCurrentActivity(): DiscordActivity | null {
    return this.currentActivity;
  }

  getClientId(): string {
    return this.clientId;
  }

  // Manual reconnect method
  async reconnect(): Promise<void> {
    this.reconnectAttempts = 0;
    await this.initializeDiscord();
  }
}

export const discordService = new DiscordService();