import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Volume2, VolumeX, Moon, Sun, Upload, Trash2, MessageCircle, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Play, Music } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { themeService, Theme } from '../services/themeService';
import { soundService, SoundPack } from '../services/soundService';
import { dataService } from '../services/dataService';

interface SettingsProps {
  sessionDuration: number;
  breakDuration: number;
  soundEnabled: boolean;
  onSave: (settings: { sessionDuration: number; breakDuration: number; soundEnabled: boolean }) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  sessionDuration,
  breakDuration,
  soundEnabled,
  onSave,
  onClose
}) => {
  const { t, language, changeLanguage, getLanguageOptions } = useTranslation();
  const currentSettings = React.useMemo(() => dataService.getSettings(), []);
  const [localSessionDuration, setLocalSessionDuration] = useState(sessionDuration);
  const [localBreakDuration, setLocalBreakDuration] = useState(breakDuration);
  const [localSoundEnabled, setLocalSoundEnabled] = useState(soundEnabled);
  const [customSessionSound, setCustomSessionSound] = useState(currentSettings.customSessionSound || '');
  const [customBreakSound, setCustomBreakSound] = useState(currentSettings.customBreakSound || '');
  const [isDarkMode, setIsDarkMode] = useState(themeService.getDarkMode());
  const [activeThemeName, setActiveThemeName] = useState<string | null>(themeService.getActiveTheme()?.name || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workshop States
  const [workshopThemes, setWorkshopThemes] = useState<Theme[]>([]);
  const [workshopSoundPacks, setWorkshopSoundPacks] = useState<SoundPack[]>([]);
  const [activeSoundPackId, setActiveSoundPackId] = useState<string>(soundService.getActiveSoundPackId());
  const [workshopTab, setWorkshopTab] = useState<'themes' | 'soundpacks'>('themes');
  const [isLoadingWorkshop, setIsLoadingWorkshop] = useState(false);
  const [isSteamRunning, setIsSteamRunning] = useState<boolean | null>(null);
  const [steamUsername, setSteamUsername] = useState<string | null>(null);
  const [workshopError, setWorkshopError] = useState<string | null>(null);

  // Theme Upload States
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Sound Pack Upload States
  const [soundPackTitle, setSoundPackTitle] = useState('');
  const [soundPackDesc, setSoundPackDesc] = useState('');
  const [soundPackSessionFile, setSoundPackSessionFile] = useState<File | null>(null);
  const [soundPackBreakFile, setSoundPackBreakFile] = useState<File | null>(null);
  const [isUploadingSoundPack, setIsUploadingSoundPack] = useState(false);

  useEffect(() => {
    loadWorkshopData();
  }, []);

  const loadWorkshopData = async () => {
    setIsLoadingWorkshop(true);
    setWorkshopError(null);
    try {
      const [themeRes, soundRes] = await Promise.all([
        themeService.fetchWorkshopThemes(),
        soundService.fetchWorkshopSoundPacks()
      ]);
      setWorkshopThemes(themeRes.themes);
      setWorkshopSoundPacks(soundRes.soundPacks);
      setIsSteamRunning(themeRes.isSteamRunning || soundRes.isSteamRunning);
      setSteamUsername(themeRes.username || soundRes.username || null);
      if (themeRes.error && !themeRes.isSteamRunning) {
        setWorkshopError(themeRes.error);
      }
    } catch (err) {
      console.error('Failed to load workshop data:', err);
      setIsSteamRunning(false);
      setWorkshopError(err instanceof Error ? err.message : 'Error communicating with Steam');
    } finally {
      setIsLoadingWorkshop(false);
    }
  };

  const applyWorkshopTheme = (theme: Theme) => {
    themeService.applyTheme(theme);
    setActiveThemeName(theme.name);
  };

  const applySoundPack = (packId: string) => {
    setActiveSoundPackId(packId);
    soundService.setActiveSoundPackId(packId);
    const allPacks = [...soundService.builtInPacks, ...workshopSoundPacks];
    const pack = allPacks.find(p => p.id === packId || p.workshopId === packId);
    if (pack) {
      soundService.previewSoundPack(pack, 'session');
    }
  };

  const previewPack = (pack: SoundPack, type: 'session' | 'break', e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundService.previewSoundPack(pack, type);
  };

  const previewAudioFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.play().catch(console.error);
  };

  const handleWorkshopUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      alert(t('workshop.uploadTitleRequired') || "Please provide a title and select a theme file (.json).");
      return;
    }
    setIsUploading(true);
    try {
      const result = await themeService.uploadToWorkshop(uploadFile, uploadTitle, uploadDescription);
      if (result.success) {
        if (result.needsAgreement) {
          alert(
            t('workshop.uploadSuccessAgreement') ||
            "Theme successfully uploaded to Steam Workshop!\n\n" +
            "Note: Steam requires that you accept the Steam Workshop Legal Agreement before other users can see your item.\n" +
            "Opening the agreement page in your browser..."
          );
          themeService.openExternal('https://steamcommunity.com/sharedfiles/workshoplegalagreement');
        } else {
          alert(t('workshop.uploadSuccess') || "Successfully uploaded to Steam Workshop!");
        }
        setUploadTitle('');
        setUploadDescription('');
        setUploadFile(null);
        await loadWorkshopData();
      } else {
        alert(`${t('workshop.uploadFailed') || 'Failed to upload to Steam Workshop:'}\n\n${result.error}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSoundPackUpload = async () => {
    if (!soundPackTitle.trim()) {
      alert(t('workshop.soundPackTitleRequired') || "Please provide a title for your Sound Pack.");
      return;
    }
    if (!soundPackSessionFile || !soundPackBreakFile) {
      alert(t('workshop.soundPackFilesRequired') || "Please select both a Session Sound and a Break Sound file (.mp3, .wav, or .ogg).");
      return;
    }

    setIsUploadingSoundPack(true);
    try {
      const result = await soundService.uploadSoundPackToWorkshop(
        soundPackTitle,
        soundPackDesc,
        soundPackSessionFile,
        soundPackBreakFile
      );

      if (result.success) {
        if (result.needsAgreement) {
          alert(
            t('workshop.soundPackUploadSuccessAgreement') ||
            "Sound Pack successfully uploaded to Steam Workshop!\n\n" +
            "Note: Steam requires that you accept the Steam Workshop Legal Agreement before other users can see your item.\n" +
            "Opening the agreement page in your browser..."
          );
          themeService.openExternal('https://steamcommunity.com/sharedfiles/workshoplegalagreement');
        } else {
          alert(t('workshop.soundPackUploadSuccess') || "Successfully published Sound Pack to Steam Workshop!");
        }
        setSoundPackTitle('');
        setSoundPackDesc('');
        setSoundPackSessionFile(null);
        setSoundPackBreakFile(null);
        await loadWorkshopData();
      } else {
        alert(`${t('workshop.soundPackUploadFailed') || 'Failed to upload Sound Pack to Steam Workshop:'}\n\n${result.error}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${msg}`);
    } finally {
      setIsUploadingSoundPack(false);
    }
  };

  const handleSave = () => {
    dataService.updateSettings({
      customSessionSound,
      customBreakSound,
      activeSoundPackId
    });
    onSave({
      sessionDuration: localSessionDuration,
      breakDuration: localBreakDuration,
      soundEnabled: localSoundEnabled
    });
  };

  const handleThemeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const success = await themeService.importThemeFromFile(file);
    if (success) {
      setActiveThemeName(themeService.getActiveTheme()?.name || null);
    } else {
      alert("Invalid theme file.");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearTheme = () => {
    themeService.applyTheme(null);
    setActiveThemeName(null);
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    themeService.setDarkMode(newMode);
  };

  const handleSoundUpload = (type: 'session' | 'break', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === 'session') {
        setCustomSessionSound(base64);
      } else {
        setCustomBreakSound(base64);
      }
    };
    reader.readAsDataURL(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  const clearSound = (type: 'session' | 'break') => {
    if (type === 'session') setCustomSessionSound('');
    else setCustomBreakSound('');
  };

  const presets = [
    { name: t('settings.shortGaming') || 'Short', session: 45, break: 5 },
    { name: t('settings.standardGaming') || 'Standard', session: 90, break: 10 },
    { name: t('settings.extendedGaming') || 'Extended', session: 120, break: 15 },
    { name: t('settings.marathonGaming') || 'Marathon', session: 150, break: 20 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-theme-surface backdrop-blur-xl border border-theme-border rounded-3xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-theme-surface z-10 pb-2 border-b border-theme-border">
          <h2 className="text-2xl font-bold text-theme-text">{t('settings.title') || 'Settings'}</h2>
          <button
            onClick={onClose}
            className="p-2 text-theme-muted hover:text-theme-text transition-colors duration-200 rounded-xl hover:bg-theme-bg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme & Appearance */}
          <div className="bg-theme-bg p-4 rounded-2xl border border-theme-border">
            <h3 className="text-sm font-bold text-theme-primary mb-4 uppercase tracking-wider">
              {t('settings.appearance') || 'Appearance'}
            </h3>
            
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-theme-text">{t('settings.darkMode') || 'Dark Mode'}</span>
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-theme-primary text-white' : 'bg-theme-border text-theme-text'}`}
              >
                {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-3">
              <span className="font-semibold text-theme-text block">{t('settings.customTheme') || 'Custom Theme'}</span>
              {activeThemeName && (
                <div className="flex items-center justify-between bg-theme-surface border border-theme-primary p-3 rounded-xl">
                  <span className="text-theme-primary font-medium flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-theme-primary"></div>
                    {activeThemeName}
                  </span>
                  <button onClick={clearTheme} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef}
                onChange={handleThemeUpload}
                className="hidden" 
                id="theme-upload"
              />
              <label 
                htmlFor="theme-upload"
                className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-theme-border text-theme-muted hover:text-theme-primary hover:border-theme-primary hover:bg-theme-primary/5 rounded-xl cursor-pointer transition-all"
              >
                <Upload className="w-4 h-4" />
                <span className="font-medium">{t('workshop.importTheme') || 'Import theme.json'}</span>
              </label>
            </div>

            {/* Steam Workshop Section */}
            <div className="mt-6 pt-6 border-t border-theme-border space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-theme-text text-sm sm:text-base">
                    {t('workshop.title') || 'Steam Workshop'}
                  </span>
                  {isSteamRunning === true && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {steamUsername ? steamUsername : (t('workshop.online') || 'Online')}
                    </span>
                  )}
                  {isSteamRunning === false && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <AlertCircle className="w-3 h-3" />
                      {t('workshop.offline') || 'Offline'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => themeService.openExternal(`https://steamcommunity.com/app/4037900/workshop/${workshopTab === 'soundpacks' ? '?requiredtags[]=SoundPack' : '?requiredtags[]=Theme'}`)}
                    className="text-xs text-theme-muted hover:text-theme-primary bg-theme-surface hover:bg-theme-border px-2.5 py-1 rounded-lg border border-theme-border transition-colors inline-flex items-center gap-1"
                    title={t('workshop.openWorkshop') || 'Workshop'}
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{t('workshop.openWorkshop') || 'Workshop'}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={loadWorkshopData} 
                    disabled={isLoadingWorkshop}
                    className="text-xs text-theme-primary bg-theme-primary/10 hover:bg-theme-primary/20 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingWorkshop ? 'animate-spin' : ''}`} />
                    <span>{isLoadingWorkshop ? (t('workshop.loading') || 'Loading...') : (t('workshop.refresh') || 'Refresh')}</span>
                  </button>
                </div>
              </div>

              {/* Workshop Sub-Tabs: Themes vs Sound-Packs */}
              <div className="flex border-b border-theme-border gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setWorkshopTab('themes')}
                  className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    workshopTab === 'themes'
                      ? 'border-theme-primary text-theme-primary'
                      : 'border-transparent text-theme-muted hover:text-theme-text'
                  }`}
                >
                  <span>🎨 {t('workshop.themesTab') || 'Themes'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-theme-primary/10 rounded-full">
                    {workshopThemes.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkshopTab('soundpacks')}
                  className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    workshopTab === 'soundpacks'
                      ? 'border-theme-primary text-theme-primary'
                      : 'border-transparent text-theme-muted hover:text-theme-text'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>🔊 {t('workshop.soundPacksTab') || 'Sound-Packs'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-theme-primary/10 rounded-full">
                    {workshopSoundPacks.length}
                  </span>
                </button>
              </div>

              {/* Global Steam Offline warning */}
              {isSteamRunning === false ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                  <p className="text-sm font-semibold text-theme-text">{t('workshop.steamOfflineTitle') || 'Steam is not running'}</p>
                  <p className="text-xs text-theme-muted max-w-sm mx-auto">
                    {t('workshop.steamOfflineDesc') || 'Please launch the Steam desktop client and log in to browse, use, or publish Workshop content.'}
                  </p>
                  {workshopError && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 max-w-xs mx-auto truncate" title={workshopError}>
                      {workshopError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={loadWorkshopData}
                    disabled={isLoadingWorkshop}
                    className="mt-1 px-3 py-1.5 bg-theme-surface hover:bg-theme-border border border-theme-border rounded-xl text-xs font-medium text-theme-text transition-all inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWorkshop ? 'animate-spin' : ''}`} />
                    {t('workshop.retryConnection') || 'Retry Connection'}
                  </button>
                </div>
              ) : isLoadingWorkshop ? (
                <div className="p-6 text-center text-sm text-theme-muted flex items-center justify-center gap-2 bg-theme-surface rounded-2xl border border-theme-border">
                  <RefreshCw className="w-4 h-4 animate-spin text-theme-primary" />
                  <span>{t('workshop.checkingWorkshop') || 'Checking Workshop subscriptions & loading content...'}</span>
                </div>
              ) : workshopTab === 'themes' ? (
                /* TAB 1: THEMES */
                <div className="space-y-4">
                  <div className="space-y-2">
                    {workshopThemes.length === 0 ? (
                      <div className="p-5 bg-theme-surface rounded-2xl border border-theme-border text-center space-y-2.5">
                        <p className="text-sm text-theme-muted italic">{t('workshop.noThemesFound') || 'No subscribed Workshop themes found.'}</p>
                        <p className="text-xs text-theme-muted">
                          {t('workshop.noThemesDesc') || 'Subscribe to themes in the Steam Workshop or publish your own below.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => themeService.openExternal('https://steamcommunity.com/app/4037900/workshop/?requiredtags[]=Theme')}
                          className="px-3.5 py-1.5 bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 border border-theme-primary/20"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {t('workshop.openWorkshop') || 'Workshop'}
                        </button>
                      </div>
                    ) : (
                      workshopThemes.map((theme, i) => {
                        const isActive = activeThemeName === theme.name;
                        return (
                          <div
                            key={theme.workshopId || i}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                              isActive 
                                ? 'border-theme-primary bg-theme-primary/10' 
                                : 'border-theme-border bg-theme-surface hover:border-theme-primary/50'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => applyWorkshopTheme(theme)}
                              className="flex-1 text-left flex items-center gap-3 overflow-hidden"
                            >
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span 
                                  className="w-3.5 h-3.5 rounded-full border border-black/20" 
                                  style={{ backgroundColor: theme.colors['--theme-bg'] }} 
                                />
                                <span 
                                  className="w-3.5 h-3.5 rounded-full border border-black/20" 
                                  style={{ backgroundColor: theme.colors['--theme-primary'] }} 
                                />
                                <span 
                                  className="w-3.5 h-3.5 rounded-full border border-black/20" 
                                  style={{ backgroundColor: theme.colors['--theme-surface'] }} 
                                />
                              </div>

                              <div className="truncate">
                                <span className="font-medium text-theme-text text-sm block truncate">
                                  {theme.name}
                                </span>
                                {isActive && (
                                  <span className="text-[10px] text-theme-primary font-semibold uppercase tracking-wider">
                                    {t('workshop.active') || 'Active'}
                                  </span>
                                )}
                              </div>
                            </button>

                            {theme.workshopId && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  themeService.openExternal(`https://steamcommunity.com/sharedfiles/filedetails/?id=${theme.workshopId}`);
                                }}
                                className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10 rounded-lg transition-colors ml-2"
                                title={t('workshop.viewOnSteam') || 'View on Steam'}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Upload Theme */}
                  <div className="pt-4 border-t border-theme-border/50">
                    <span className="font-semibold text-theme-text text-sm block mb-2">{t('workshop.publishTheme') || 'Publish Theme to Steam Workshop'}</span>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder={t('workshop.themeTitlePlaceholder') || 'Theme Title'}
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        disabled={isUploading}
                        className="w-full p-2.5 text-sm bg-theme-surface border border-theme-border rounded-xl text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-primary disabled:opacity-50"
                      />
                      <textarea
                        placeholder={t('workshop.themeDescPlaceholder') || 'Theme Description'}
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        disabled={isUploading}
                        className="w-full p-2.5 text-sm bg-theme-surface border border-theme-border rounded-xl text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-primary resize-none disabled:opacity-50"
                        rows={2}
                      />
                      
                      <div className="flex items-center gap-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-theme-border text-theme-muted hover:text-theme-primary hover:border-theme-primary hover:bg-theme-primary/5 rounded-xl cursor-pointer transition-all text-xs font-medium ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                          <Upload className="w-4 h-4" />
                          <span className="truncate max-w-[200px]">
                            {uploadFile ? uploadFile.name : (t('workshop.selectThemeJson') || 'Select theme JSON (.json)')}
                          </span>
                          <input 
                            type="file" 
                            accept=".json"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            disabled={isUploading}
                            className="hidden" 
                          />
                        </label>

                        {uploadFile && (
                          <button
                            type="button"
                            onClick={() => setUploadFile(null)}
                            disabled={isUploading}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20"
                            title={t('workshop.removeFile') || 'Remove file'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleWorkshopUpload}
                        disabled={isUploading || !uploadFile || !uploadTitle.trim()}
                        className="w-full p-2.5 mt-2 bg-theme-primary hover:bg-theme-primaryHover text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{t('workshop.publishing') || 'Uploading to Steam...'}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>{t('workshop.publishThemeBtn') || 'Publish Theme'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB 2: SOUND-PACKS */
                <div className="space-y-4">
                  <div className="space-y-2">
                    {workshopSoundPacks.length === 0 ? (
                      <div className="p-5 bg-theme-surface rounded-2xl border border-theme-border text-center space-y-2.5">
                        <Music className="w-8 h-8 text-theme-muted mx-auto opacity-40" />
                        <p className="text-sm text-theme-muted italic">{t('workshop.noSoundPacksFound') || 'No subscribed Sound-Packs found.'}</p>
                        <p className="text-xs text-theme-muted">
                          {t('workshop.noSoundPacksDesc') || 'Subscribe to Sound-Packs in the Steam Workshop or publish your own below.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => themeService.openExternal('https://steamcommunity.com/app/4037900/workshop/?requiredtags[]=SoundPack')}
                          className="px-3.5 py-1.5 bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 border border-theme-primary/20"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {t('workshop.openWorkshop') || 'Workshop'}
                        </button>
                      </div>
                    ) : (
                      workshopSoundPacks.map((pack) => {
                        const isActive = activeSoundPackId === pack.id || activeSoundPackId === pack.workshopId;
                        return (
                          <div
                            key={pack.workshopId || pack.id}
                            className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                              isActive 
                                ? 'border-theme-primary bg-theme-primary/10' 
                                : 'border-theme-border bg-theme-surface hover:border-theme-primary/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate">
                                <span className="font-semibold text-theme-text text-sm block truncate">
                                  {pack.name}
                                </span>
                                {pack.description && (
                                  <span className="text-xs text-theme-muted block truncate">
                                    {pack.description}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => applySoundPack(pack.id)}
                                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                    isActive
                                      ? 'bg-theme-primary text-white shadow-sm'
                                      : 'bg-theme-surface hover:bg-theme-border text-theme-text border border-theme-border'
                                  }`}
                                >
                                  {isActive ? `✓ ${t('workshop.active') || 'Active'}` : (t('workshop.activate') || 'Activate')}
                                </button>

                                {pack.workshopId && (
                                  <button
                                    type="button"
                                    onClick={() => themeService.openExternal(`https://steamcommunity.com/sharedfiles/filedetails/?id=${pack.workshopId}`)}
                                    className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10 rounded-lg transition-colors"
                                    title={t('workshop.viewOnSteam') || 'View on Steam'}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Sound Preview Buttons */}
                            <div className="flex items-center gap-2 pt-1 border-t border-theme-border/40">
                              <button
                                type="button"
                                onClick={(e) => previewPack(pack, 'session', e)}
                                className="px-2.5 py-1 bg-theme-bg hover:bg-theme-primary/10 hover:text-theme-primary text-theme-muted text-xs font-medium rounded-lg border border-theme-border transition-colors flex items-center gap-1.5"
                                title={t('workshop.previewSessionSound') || 'Preview session end sound'}
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>{t('workshop.sessionSound') || 'Session Sound'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => previewPack(pack, 'break', e)}
                                className="px-2.5 py-1 bg-theme-bg hover:bg-theme-primary/10 hover:text-theme-primary text-theme-muted text-xs font-medium rounded-lg border border-theme-border transition-colors flex items-center gap-1.5"
                                title={t('workshop.previewBreakSound') || 'Preview break end sound'}
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>{t('workshop.breakSound') || 'Break Sound'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Upload Sound Pack */}
                  <div className="pt-4 border-t border-theme-border/50">
                    <span className="font-semibold text-theme-text text-sm block mb-2">{t('workshop.publishSoundPack') || 'Publish Sound-Pack to Steam Workshop'}</span>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder={t('workshop.soundPackTitlePlaceholder') || 'Sound-Pack Title (e.g. Sci-Fi Retro Chimes)'}
                        value={soundPackTitle}
                        onChange={(e) => setSoundPackTitle(e.target.value)}
                        disabled={isUploadingSoundPack}
                        className="w-full p-2.5 text-sm bg-theme-surface border border-theme-border rounded-xl text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-primary disabled:opacity-50"
                      />
                      <textarea
                        placeholder={t('workshop.soundPackDescPlaceholder') || 'Description of the sound effects'}
                        value={soundPackDesc}
                        onChange={(e) => setSoundPackDesc(e.target.value)}
                        disabled={isUploadingSoundPack}
                        className="w-full p-2.5 text-sm bg-theme-surface border border-theme-border rounded-xl text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-primary resize-none disabled:opacity-50"
                        rows={2}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs font-semibold text-theme-muted block mb-1">{t('workshop.sessionAudio') || 'Session End Audio'}</span>
                          <div className="flex items-center gap-1.5">
                            <label className={`flex-1 flex items-center justify-center gap-1.5 p-2 border-2 border-dashed border-theme-border text-theme-muted hover:text-theme-primary hover:border-theme-primary hover:bg-theme-primary/5 rounded-xl cursor-pointer transition-all text-xs ${isUploadingSoundPack ? 'opacity-50 pointer-events-none' : ''}`}>
                              <Upload className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[110px]">
                                {soundPackSessionFile ? soundPackSessionFile.name : (t('soundPacks.uploadAudio') || 'Upload MP3/WAV/OGG')}
                              </span>
                              <input
                                type="file"
                                accept="audio/mp3,audio/wav,audio/ogg,audio/*"
                                onChange={(e) => setSoundPackSessionFile(e.target.files?.[0] || null)}
                                disabled={isUploadingSoundPack}
                                className="hidden"
                              />
                            </label>
                            {soundPackSessionFile && (
                              <button
                                type="button"
                                onClick={() => previewAudioFile(soundPackSessionFile)}
                                className="p-2 bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary rounded-xl transition-colors"
                                title={t('workshop.preview') || 'Preview'}
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-theme-muted block mb-1">{t('workshop.breakAudio') || 'Break End Audio'}</span>
                          <div className="flex items-center gap-1.5">
                            <label className={`flex-1 flex items-center justify-center gap-1.5 p-2 border-2 border-dashed border-theme-border text-theme-muted hover:text-theme-primary hover:border-theme-primary hover:bg-theme-primary/5 rounded-xl cursor-pointer transition-all text-xs ${isUploadingSoundPack ? 'opacity-50 pointer-events-none' : ''}`}>
                              <Upload className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[110px]">
                                {soundPackBreakFile ? soundPackBreakFile.name : (t('soundPacks.uploadAudio') || 'Upload MP3/WAV/OGG')}
                              </span>
                              <input
                                type="file"
                                accept="audio/mp3,audio/wav,audio/ogg,audio/*"
                                onChange={(e) => setSoundPackBreakFile(e.target.files?.[0] || null)}
                                disabled={isUploadingSoundPack}
                                className="hidden"
                              />
                            </label>
                            {soundPackBreakFile && (
                              <button
                                type="button"
                                onClick={() => previewAudioFile(soundPackBreakFile)}
                                className="p-2 bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary rounded-xl transition-colors"
                                title={t('workshop.preview') || 'Preview'}
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSoundPackUpload}
                        disabled={isUploadingSoundPack || !soundPackSessionFile || !soundPackBreakFile || !soundPackTitle.trim()}
                        className="w-full p-2.5 mt-2 bg-theme-primary hover:bg-theme-primaryHover text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isUploadingSoundPack ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{t('workshop.publishing') || 'Uploading to Steam...'}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>{t('workshop.publishSoundPackBtn') || 'Publish Sound-Pack'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-semibold text-theme-text mb-3">{t('settings.language') || 'Language'}</label>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as any)}
              className="w-full p-3 bg-theme-bg border border-theme-border rounded-xl font-medium text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
            >
              {getLanguageOptions().map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-sm font-semibold text-theme-text mb-3">{t('settings.quickPresets') || 'Presets'}</label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setLocalSessionDuration(preset.session);
                    setLocalBreakDuration(preset.break);
                  }}
                  className="p-3 text-sm font-medium text-theme-text bg-theme-bg hover:bg-theme-border border border-theme-border rounded-xl transition-colors duration-200 text-left"
                >
                  <div className="font-semibold">{preset.name}</div>
                  <div className="text-xs text-theme-muted">{preset.session}m + {preset.break}m</div>
                </button>
              ))}
            </div>
          </div>

          {/* Session Duration */}
          <div>
            <label className="block text-sm font-semibold text-theme-text mb-2">
              {t('settings.sessionDuration') || 'Session Duration'}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={localSessionDuration}
                onChange={(e) => setLocalSessionDuration(Number(e.target.value))}
                className="flex-1 h-2 bg-theme-border rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-lg font-bold text-theme-text w-12 text-right">
                {localSessionDuration}m
              </span>
            </div>
          </div>

          {/* Break Duration */}
          <div>
            <label className="block text-sm font-semibold text-theme-text mb-2">
              {t('settings.breakDuration') || 'Break Duration'}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={localBreakDuration}
                onChange={(e) => setLocalBreakDuration(Number(e.target.value))}
                className="flex-1 h-2 bg-theme-border rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-lg font-bold text-theme-text w-12 text-right">
                {localBreakDuration}m
              </span>
            </div>
          </div>

          {/* Sound Settings */}
          <div className="bg-theme-bg p-4 rounded-2xl border border-theme-border">
            <h3 className="text-sm font-bold text-theme-primary mb-4 uppercase tracking-wider">Audio Settings</h3>
            
            <div className="mb-4">
              <button
                onClick={() => setLocalSoundEnabled(!localSoundEnabled)}
                className={`flex items-center justify-center gap-3 p-3 rounded-xl transition-all duration-200 w-full ${
                  localSoundEnabled 
                    ? 'bg-theme-primary/10 text-theme-primary border-2 border-theme-primary' 
                    : 'bg-theme-bg text-theme-muted border-2 border-theme-border'
                }`}
              >
                {localSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                <span className="font-medium">
                  {localSoundEnabled ? (t('settings.soundEnabled') || 'Enabled') : (t('settings.soundDisabled') || 'Disabled')}
                </span>
              </button>
            </div>

            {localSoundEnabled && (
              <div className="space-y-5">
                {/* Sound Pack Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-semibold text-theme-text text-sm">{t('soundPacks.title') || 'Active Sound-Pack Profile'}</span>
                    <button
                      type="button"
                      onClick={() => setWorkshopTab('soundpacks')}
                      className="text-xs text-theme-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>{t('soundPacks.workshopLink') || 'Workshop Sound-Packs'} ({workshopSoundPacks.length})</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {[...soundService.builtInPacks, ...workshopSoundPacks].map((pack) => {
                      const isActive = activeSoundPackId === pack.id || activeSoundPackId === pack.workshopId;
                      return (
                        <div
                          key={pack.workshopId || pack.id}
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            isActive
                              ? 'border-theme-primary bg-theme-primary/10'
                              : 'border-theme-border bg-theme-surface hover:border-theme-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-theme-text text-sm">
                                  {pack.name}
                                </span>
                                {pack.isBuiltIn && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-theme-border text-theme-muted font-medium">
                                    {t('soundPacks.builtIn') || 'Built-in'}
                                  </span>
                                )}
                                {pack.workshopId && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-theme-primary/20 text-theme-primary font-medium">
                                    {t('soundPacks.workshop') || 'Workshop'}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-theme-muted block truncate">
                                {pack.description}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => applySoundPack(pack.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                                isActive
                                  ? 'bg-theme-primary text-white shadow-sm'
                                  : 'bg-theme-surface hover:bg-theme-border text-theme-text border border-theme-border'
                              }`}
                            >
                              {isActive ? `✓ ${t('workshop.active') || 'Active'}` : (t('soundPacks.select') || 'Select')}
                            </button>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-theme-border/40">
                            <button
                              type="button"
                              onClick={(e) => previewPack(pack, 'session', e)}
                              className="px-2 py-0.5 bg-theme-bg hover:bg-theme-primary/10 hover:text-theme-primary text-theme-muted text-[11px] font-medium rounded border border-theme-border transition-colors flex items-center gap-1"
                              title={t('workshop.previewSessionSound') || 'Preview session end sound'}
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>{t('soundPacks.session') || 'Session'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => previewPack(pack, 'break', e)}
                              className="px-2 py-0.5 bg-theme-bg hover:bg-theme-primary/10 hover:text-theme-primary text-theme-muted text-[11px] font-medium rounded border border-theme-border transition-colors flex items-center gap-1"
                              title={t('workshop.previewBreakSound') || 'Preview break end sound'}
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>{t('soundPacks.break') || 'Break'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Custom Overrides */}
                <div className="pt-4 border-t border-theme-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-theme-text text-sm">{t('soundPacks.customOverrides') || 'Custom Sound Overrides (optional)'}</span>
                    {(customSessionSound || customBreakSound) && (
                      <span className="text-xs text-theme-primary font-medium">{t('soundPacks.customOverridesActive') || 'Custom active'}</span>
                    )}
                  </div>
                  
                  {/* Session Sound */}
                  <div>
                    <span className="text-xs text-theme-muted block mb-1">{t('soundPacks.customSessionSound') || 'Custom Session End Sound'}</span>
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 p-2 border-2 border-dashed border-theme-border text-theme-muted hover:text-theme-primary hover:border-theme-primary hover:bg-theme-primary/5 rounded-xl cursor-pointer transition-all text-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span className="font-medium truncate max-w-[150px]">
                          {customSessionSound ? (t('soundPacks.customSoundSet') || 'Custom sound set') : (t('soundPacks.uploadAudio') || 'Upload MP3/WAV/OGG')}
                        </span>
                        <input 
                          type="file" 
                          accept="audio/mp3,audio/wav,audio/ogg,audio/*" 
                          onChange={(e) => handleSoundUpload('session', e)}
                          className="hidden" 
                        />
                      </label>
                      {customSessionSound && (
                        <button 
                          onClick={() => clearSound('session')} 
                          className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors border border-red-500/20"
                          title={t('soundPacks.removeCustomFile') || 'Remove custom audio file'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Break Sound */}
                  <div>
                    <span className="text-xs text-theme-muted block mb-1">{t('soundPacks.customBreakSound') || 'Custom Break End Sound'}</span>
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 p-2 border-2 border-dashed border-theme-border text-theme-muted hover:text-theme-primary hover:border-theme-primary hover:bg-theme-primary/5 rounded-xl cursor-pointer transition-all text-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span className="font-medium truncate max-w-[150px]">
                          {customBreakSound ? (t('soundPacks.customSoundSet') || 'Custom sound set') : (t('soundPacks.uploadAudio') || 'Upload MP3/WAV/OGG')}
                        </span>
                        <input 
                          type="file" 
                          accept="audio/mp3,audio/wav,audio/ogg,audio/*" 
                          onChange={(e) => handleSoundUpload('break', e)}
                          className="hidden" 
                        />
                      </label>
                      {customBreakSound && (
                        <button 
                          onClick={() => clearSound('break')} 
                          className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors border border-red-500/20"
                          title={t('soundPacks.removeCustomFile') || 'Remove custom audio file'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-theme-border">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-theme-text bg-theme-bg hover:bg-theme-border border border-theme-border rounded-xl font-semibold transition-colors duration-200"
            >
              {t('settings.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-theme-primary hover:bg-theme-primaryHover text-white rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {t('settings.save') || 'Save'}
            </button>
          </div>

          {/* Support Section */}
          <div className="pt-4 text-center">
            <a
              href="https://discord.gg/HsFuPjMX5T"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl font-semibold transition-colors duration-200 w-full"
            >
              <MessageCircle className="w-5 h-5" />
              Join our Discord Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;