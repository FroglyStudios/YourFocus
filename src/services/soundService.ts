import { dataService } from './dataService';

export interface SoundPack {
  id: string;
  name: string;
  description: string;
  workshopId?: string;
  isBuiltIn?: boolean;
  sessionSound?: string; // base64 or URL
  breakSound?: string;   // base64 or URL
  synthType?: 'classic' | '8bit' | 'zen' | 'cyberpunk';
}

export interface WorkshopSoundPacksResult {
  soundPacks: SoundPack[];
  isSteamRunning: boolean;
  username?: string;
  error?: string;
}

export interface WorkshopSoundPackUploadResult {
  success: boolean;
  itemId?: string;
  needsAgreement?: boolean;
  error?: string;
}

class SoundService {
  private audioCtx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  public readonly builtInPacks: SoundPack[] = [
    {
      id: 'classic',
      name: 'Classic Chimes',
      description: 'Pleasant harmonic chimes for focus and breaks',
      isBuiltIn: true,
      synthType: 'classic'
    },
    {
      id: '8bit',
      name: '8-Bit Retro Arcade',
      description: 'Nostalgic chiptune arpeggios & level-up jingles',
      isBuiltIn: true,
      synthType: '8bit'
    },
    {
      id: 'zen',
      name: 'Zen Meditation Bell',
      description: 'Deep resonant Tibetan singing bowl & temple bell',
      isBuiltIn: true,
      synthType: 'zen'
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Synth',
      description: 'Futuristic pulse and neon synthesizer tones',
      isBuiltIn: true,
      synthType: 'cyberpunk'
    }
  ];

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public getActiveSoundPackId(): string {
    const settings = dataService.getSettings();
    return settings.activeSoundPackId || 'classic';
  }

  public setActiveSoundPackId(id: string): void {
    dataService.updateSettings({ activeSoundPackId: id });
  }

  public getActiveSoundPack(workshopPacks: SoundPack[] = []): SoundPack {
    const activeId = this.getActiveSoundPackId();
    // Check built-in packs
    const builtIn = this.builtInPacks.find(p => p.id === activeId);
    if (builtIn) return builtIn;

    // Check workshop packs
    const workshop = workshopPacks.find(p => p.id === activeId || p.workshopId === activeId);
    if (workshop) return workshop;

    return this.builtInPacks[0]; // fallback to classic
  }

  // Synthesize procedural built-in audio
  private playSynthesized(type: 'session' | 'break', synthType: SoundPack['synthType'] = 'classic') {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    if (synthType === '8bit') {
      // 8-Bit Chiptune Arpeggio
      const notes = type === 'session' 
        ? [261.63, 329.63, 392.00, 523.25, 659.25] // C4, E4, G4, C5, E5 (Level Up!)
        : [523.25, 493.88, 440.00, 349.23, 261.63]; // Descending break chime
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
      return;
    }

    if (synthType === 'zen') {
      // Deep Singing Bowl / Meditation Bell (Harmonic resonance with slow decay)
      const baseFreq = type === 'session' ? 432 : 324;
      const harmonics = [1, 2.76, 5.4];

      harmonics.forEach((harmonic, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * harmonic, now);

        const volume = (0.22 / (idx + 1));
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.85);
      });
      return;
    }

    if (synthType === 'cyberpunk') {
      // Futuristic Synth Pulse
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      const targetFreq = type === 'session' ? 440 : 330;
      osc1.frequency.setValueAtTime(targetFreq, now);
      osc2.frequency.setValueAtTime(targetFreq * 1.5, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 1.2);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.25);
      osc2.stop(now + 1.25);
      return;
    }

    // Default 'classic': Harmonic Marimba / Bell Chime
    const chord = type === 'session' ? [523.25, 659.25, 783.99] : [659.25, 587.33, 523.25];
    chord.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);

      gain.gain.setValueAtTime(0, now + index * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, now + index * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 1.45);
    });
  }

  // Play a sound file (data URI or url)
  public playAudioFile(src: string): Promise<void> {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
    }
    this.currentAudio = new Audio(src);
    return this.currentAudio.play().catch(e => {
      console.warn('Audio playback was prevented or failed:', e);
    });
  }

  // Preview a specific sound pack
  public previewSoundPack(pack: SoundPack, type: 'session' | 'break') {
    if (pack.isBuiltIn && pack.synthType) {
      this.playSynthesized(type, pack.synthType);
      return;
    }

    const soundSrc = type === 'session' ? pack.sessionSound : pack.breakSound;
    if (soundSrc) {
      this.playAudioFile(soundSrc);
    } else if (pack.synthType) {
      this.playSynthesized(type, pack.synthType);
    }
  }

  // Main method to play sound alert for timer completion
  public play(type: 'session' | 'break', workshopPacks: SoundPack[] = []) {
    const settings = dataService.getSettings();
    if (!settings.soundEnabled) return;

    // Check if user set custom individual sound overrides
    if (type === 'session' && settings.customSessionSound) {
      this.playAudioFile(settings.customSessionSound);
      return;
    }
    if (type === 'break' && settings.customBreakSound) {
      this.playAudioFile(settings.customBreakSound);
      return;
    }

    // Otherwise use active sound pack
    const activePack = this.getActiveSoundPack(workshopPacks);
    this.previewSoundPack(activePack, type);
  }

  // Workshop API integrations
  public async fetchWorkshopSoundPacks(): Promise<WorkshopSoundPacksResult> {
    const win = window as any;
    if (win.electronAPI && win.electronAPI.steam && win.electronAPI.steam.getWorkshopSoundPacks) {
      try {
        const res = await win.electronAPI.steam.getWorkshopSoundPacks();
        return {
          soundPacks: res.soundPacks || [],
          isSteamRunning: Boolean(res.isSteamRunning),
          username: res.username,
          error: res.error
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { soundPacks: [], isSteamRunning: false, error: msg };
      }
    }
    return { soundPacks: [], isSteamRunning: false, error: 'Steam API not available' };
  }

  public async uploadSoundPackToWorkshop(
    title: string,
    description: string,
    sessionFile: File,
    breakFile: File
  ): Promise<WorkshopSoundPackUploadResult> {
    const win = window as any;
    if (!win.electronAPI || !win.electronAPI.steam || !win.electronAPI.steam.uploadWorkshopSoundPack) {
      return { success: false, error: 'Steam API not available.' };
    }

    const readFileAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    };

    try {
      const sessionBase64 = await readFileAsBase64(sessionFile);
      const breakBase64 = await readFileAsBase64(breakFile);

      const result = await win.electronAPI.steam.uploadWorkshopSoundPack(
        title,
        description,
        sessionBase64,
        sessionFile.name,
        breakBase64,
        breakFile.name
      );

      return {
        success: Boolean(result?.success),
        itemId: result?.itemId,
        needsAgreement: Boolean(result?.needsToAcceptAgreement),
        error: result?.error
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }
}

export const soundService = new SoundService();

