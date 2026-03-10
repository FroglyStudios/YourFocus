import React, { useState } from 'react';
import { X, Save, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

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
  const [localSessionDuration, setLocalSessionDuration] = useState(sessionDuration);
  const [localBreakDuration, setLocalBreakDuration] = useState(breakDuration);
  const [localSoundEnabled, setLocalSoundEnabled] = useState(soundEnabled);

  const handleSave = () => {
    onSave({
      sessionDuration: localSessionDuration,
      breakDuration: localBreakDuration,
      soundEnabled: localSoundEnabled
    });
  };

  const presets = [
    { name: t('settings.shortGaming'), session: 45, break: 5 },
    { name: t('settings.standardGaming'), session: 90, break: 10 },
    { name: t('settings.extendedGaming'), session: 120, break: 15 },
    { name: t('settings.marathonGaming'), session: 150, break: 20 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors duration-200 rounded-xl hover:bg-slate-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">{t('settings.language')}</label>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as any)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-semibold text-slate-700 mb-3">{t('settings.quickPresets')}</label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setLocalSessionDuration(preset.session);
                    setLocalBreakDuration(preset.break);
                  }}
                  className="p-3 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors duration-200 text-left"
                >
                  <div className="font-semibold">{preset.name}</div>
                  <div className="text-xs text-slate-500">{preset.session}m + {preset.break}m</div>
                </button>
              ))}
            </div>
          </div>

          {/* Session Duration */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {t('settings.sessionDuration')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={localSessionDuration}
                onChange={(e) => setLocalSessionDuration(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-lg font-bold text-slate-800 w-12 text-right">
                {localSessionDuration}m
              </span>
            </div>
          </div>

          {/* Break Duration */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {t('settings.breakDuration')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={localBreakDuration}
                onChange={(e) => setLocalBreakDuration(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-lg font-bold text-slate-800 w-12 text-right">
                {localBreakDuration}m
              </span>
            </div>
          </div>

          {/* Sound Settings */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">{t('settings.audioNotifications')}</label>
            <button
              onClick={() => setLocalSoundEnabled(!localSoundEnabled)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full ${
                localSoundEnabled 
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                  : 'bg-slate-50 text-slate-600 border-2 border-slate-200'
              }`}
            >
              {localSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="font-medium">
                {localSoundEnabled ? t('settings.soundEnabled') : t('settings.soundDisabled')}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors duration-200"
            >
              {t('settings.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {t('settings.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;