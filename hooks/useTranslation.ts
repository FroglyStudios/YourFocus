import { useState, useEffect } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'ko' | 'zh' | 'ja' | 'ru';

interface Translations {
  [key: string]: any;
}

const translations: Record<Language, Translations> = {
  en: {},
  es: {},
  fr: {},
  de: {},
  ko: {},
  zh: {},
  ja: {},
  ru: {}
};

// Load translations dynamically using Vite's import.meta.glob
const loadTranslations = async () => {
  try {
    const translationModules = import.meta.glob('../translations/*.json');
    for (const path in translationModules) {
      const match = path.match(/\/([^/]+)\.json$/);
      if (match) {
        const langCode = match[1] as Language;
        const module = await translationModules[path]() as any;
        translations[langCode] = module.default;
      }
    }
  } catch (error) {
    console.error('Failed to load translations:', error);
  }
};

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initTranslations = async () => {
      await loadTranslations();
      
      const savedLanguage = localStorage.getItem('yourfocus-language') as Language;
      if (savedLanguage && ['en', 'es', 'fr', 'de', 'ko', 'zh', 'ja', 'ru'].includes(savedLanguage)) {
        setLanguage(savedLanguage);
      }
      
      setIsLoaded(true);
    };

    initTranslations();

    const handleLanguageChange = (e: any) => {
      setLanguage(e.detail);
    };
    window.addEventListener('yourfocus-language-change', handleLanguageChange);
    return () => {
      window.removeEventListener('yourfocus-language-change', handleLanguageChange);
    };
  }, []);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('yourfocus-language', newLanguage);
    window.dispatchEvent(new CustomEvent('yourfocus-language-change', { detail: newLanguage }));
  };

  const t = (key: string): string => {
    if (!isLoaded) return key;
    
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found in fallback
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const getLanguageOptions = () => [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ko', name: '한국어 (Korean)' },
    { code: 'zh', name: '中文 (Chinese)' },
    { code: 'ja', name: '日本語 (Japanese)' },
    { code: 'ru', name: 'Русский (Russian)' }
  ];

  return {
    t,
    language,
    changeLanguage,
    getLanguageOptions,
    isLoaded
  };
};