import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Volume2, VolumeX, Moon, Sun, Upload, Trash2, MessageCircle, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { themeService, Theme } from '../services/themeService';
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
  const [isLoadingWorkshop, setIsLoadingWorkshop] = useState(false);
  const [isSteamRunning, setIsSteamRunning] = useState<boolean | null>(null);
  const [steamUsername, setSteamUsername] = useState<string | null>(null);
  const [workshopError, setWorkshopError] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadWorkshopThemes();
  }, []);

  const loadWorkshopThemes = async () => {
    setIsLoadingWorkshop(true);
    setWorkshopError(null);
    try {
      const result = await themeService.fetchWorkshopThemes();
      setWorkshopThemes(result.themes);
      setIsSteamRunning(result.isSteamRunning);
      setSteamUsername(result.username || null);
      if (result.error && !result.isSteamRunning) {
        setWorkshopError(result.error);
      }
    } catch (err) {
      console.error('Failed to load workshop themes:', err);
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

  const handleWorkshopUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      alert("Please provide a title and select a theme file (.json).");
      return;
    }
    setIsUploading(true);
    try {
      const result = await themeService.uploadToWorkshop(uploadFile, uploadTitle, uploadDescription);
      if (result.success) {
        if (result.needsAgreement) {
          alert(
            "Theme successfully uploaded to Steam Workshop!\n\n" +
            "Note: Steam requires that you accept the Steam Workshop Legal Agreement before other users can see your item.\n" +
            "Opening the agreement page in your browser..."
          );
          themeService.openExternal('https://steamcommunity.com/sharedfiles/workshoplegalagreement');
        } else {
          alert("Successfully uploaded to Steam Workshop!");
        }
        setUploadTitle('');
        setUploadDescription('');
        setUploadFile(null);
        // Refresh themes so the new theme appears immediately
        await loadWorkshopThemes();
      } else {
        alert(`Failed to upload to Steam Workshop:\n\n${result.error}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    dataService.updateSettings({
      customSessionSound,
      customBreakSound
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
            <h3 className="text-sm font-bold text-theme-primary mb-4 uppercase tracking-wider">Appearance</h3>
            
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-theme-text">Dark Mode</span>
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-theme-primary text-white' : 'bg-theme-border text-theme-text'}`}
              >
                {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-3">
              <span className="font-semibold text-theme-text block">Custom Theme</span>
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
                <span className="font-medium">Import theme.json</span>
              </label>
            </div>

            {/* Steam Workshop Themes */}
            <div className="mt-6 pt-6 border-t border-theme-border space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-theme-text text-sm sm:text-base">
                    Steam Workshop Themes
                  </span>
                  {isSteamRunning === true && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {steamUsername ? steamUsername : 'Online'}
                    </span>
                  )}
                  {isSteamRunning === false && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <AlertCircle className="w-3 h-3" />
                      Offline
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => themeService.openExternal('https://steamcommunity.com/app/4037900/workshop/')}
                    className="text-xs text-theme-muted hover:text-theme-primary bg-theme-surface hover:bg-theme-border px-2.5 py-1 rounded-lg border border-theme-border transition-colors inline-flex items-center gap-1"
                    title="Open Workshop in Browser"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Workshop</span>
                  </button>
                  <button 
                    type="button"
                    onClick={loadWorkshopThemes} 
                    disabled={isLoadingWorkshop}
                    className="text-xs text-theme-primary bg-theme-primary/10 hover:bg-theme-primary/20 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingWorkshop ? 'animate-spin' : ''}`} />
                    <span>{isLoadingWorkshop ? 'Lade...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {isSteamRunning === false ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                    <p className="text-sm font-semibold text-theme-text">Steam ist nicht gestartet</p>
                    <p className="text-xs text-theme-muted max-w-sm mx-auto">
                      Bitte starte den Steam Desktop-Client und melde dich an, um Workshop-Themes zu nutzen oder neue hochzuladen.
                    </p>
                    {workshopError && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 max-w-xs mx-auto truncate" title={workshopError}>
                        {workshopError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={loadWorkshopThemes}
                      disabled={isLoadingWorkshop}
                      className="mt-1 px-3 py-1.5 bg-theme-surface hover:bg-theme-border border border-theme-border rounded-xl text-xs font-medium text-theme-text transition-all inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWorkshop ? 'animate-spin' : ''}`} />
                      Verbindung wiederholen
                    </button>
                  </div>
                ) : isLoadingWorkshop ? (
                  <div className="p-6 text-center text-sm text-theme-muted flex items-center justify-center gap-2 bg-theme-surface rounded-2xl border border-theme-border">
                    <RefreshCw className="w-4 h-4 animate-spin text-theme-primary" />
                    <span>Prüfe Workshop-Abonnements & lade Themes...</span>
                  </div>
                ) : workshopThemes.length === 0 ? (
                  <div className="p-5 bg-theme-surface rounded-2xl border border-theme-border text-center space-y-2.5">
                    <p className="text-sm text-theme-muted italic">Keine abonnierten Workshop-Themes gefunden.</p>
                    <p className="text-xs text-theme-muted">
                      Abonniere Themes im Steam Workshop oder veröffentliche unten dein eigenes Design.
                    </p>
                    <button
                      type="button"
                      onClick={() => themeService.openExternal('https://steamcommunity.com/app/4037900/workshop/')}
                      className="px-3.5 py-1.5 bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 border border-theme-primary/20"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Workshop öffnen
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
                          {/* Color preview dots */}
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
                                Aktiv
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
                            title="Auf Steam anzeigen"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Upload to Workshop */}
              <div className="pt-4 mt-4 border-t border-theme-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-theme-text text-sm">Theme im Steam Workshop veröffentlichen</span>
                </div>

                {isSteamRunning === false && (
                  <p className="text-xs text-amber-500 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 mb-3">
                    Steam muss gestartet sein, um Themes im Workshop hochzuladen.
                  </p>
                )}

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Theme Titel"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    disabled={isUploading || isSteamRunning === false}
                    className="w-full p-2.5 text-sm bg-theme-surface border border-theme-border rounded-xl text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-primary disabled:opacity-50"
                  />
                  <textarea
                    placeholder="Theme Beschreibung"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    disabled={isUploading || isSteamRunning === false}
                    className="w-full p-2.5 text-sm bg-theme-surface border border-theme-border rounded-xl text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-primary resize-none disabled:opacity-50"
                    rows={2}
                  />
                  
                  <div className="flex items-center gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-theme-border text-theme-muted hover:text-theme-primary hover:border-theme-primary hover:bg-theme-primary/5 rounded-xl cursor-pointer transition-all text-xs font-medium ${isUploading || isSteamRunning === false ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="w-4 h-4" />
                      <span className="truncate max-w-[200px]">
                        {uploadFile ? uploadFile.name : 'Theme JSON auswählen (.json)'}
                      </span>
                      <input 
                        type="file" 
                        accept=".json"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        disabled={isUploading || isSteamRunning === false}
                        className="hidden" 
                      />
                    </label>

                    {uploadFile && (
                      <button
                        type="button"
                        onClick={() => setUploadFile(null)}
                        disabled={isUploading}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20"
                        title="Datei entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleWorkshopUpload}
                    disabled={isUploading || isSteamRunning === false || !uploadFile || !uploadTitle.trim()}
                    className="w-full p-2.5 mt-2 bg-theme-primary hover:bg-theme-primaryHover text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Wird bei Steam hochgeladen...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Im Steam Workshop veröffentlichen</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
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
              <div className="space-y-4">
                {/* Session Sound */}
                <div>
                  <span className="font-semibold text-theme-text block text-sm mb-2">Custom Session Sound</span>
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 p-2 border-2 border-dashed border-theme-border text-theme-muted hover:text-theme-primary hover:border-theme-primary hover:bg-theme-primary/5 rounded-xl cursor-pointer transition-all text-sm">
                      <Upload className="w-4 h-4" />
                      <span className="font-medium truncate max-w-[150px]">
                        {customSessionSound ? 'Custom Sound Set' : 'Upload MP3/WAV'}
                      </span>
                      <input 
                        type="file" 
                        accept="audio/mp3,audio/wav,audio/*" 
                        onChange={(e) => handleSoundUpload('session', e)}
                        className="hidden" 
                      />
                    </label>
                    {customSessionSound && (
                      <button onClick={() => clearSound('session')} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors border border-red-500/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Break Sound */}
                <div>
                  <span className="font-semibold text-theme-text block text-sm mb-2">Custom Break Sound</span>
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 p-2 border-2 border-dashed border-theme-border text-theme-muted hover:text-theme-primary hover:border-theme-primary hover:bg-theme-primary/5 rounded-xl cursor-pointer transition-all text-sm">
                      <Upload className="w-4 h-4" />
                      <span className="font-medium truncate max-w-[150px]">
                        {customBreakSound ? 'Custom Sound Set' : 'Upload MP3/WAV'}
                      </span>
                      <input 
                        type="file" 
                        accept="audio/mp3,audio/wav,audio/*" 
                        onChange={(e) => handleSoundUpload('break', e)}
                        className="hidden" 
                      />
                    </label>
                    {customBreakSound && (
                      <button onClick={() => clearSound('break')} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors border border-red-500/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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