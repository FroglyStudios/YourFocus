import { useState, useEffect } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de';

interface Translations {
  [key: string]: any;
}

const translations: Record<Language, Translations> = {
  en: {},
  es: {},
  fr: {},
  de: {}
};

// Load translations dynamically
const loadTranslations = async () => {
  try {
    const [enTranslations, esTranslations, frTranslations, deTranslations] = await Promise.all([
      import('../translations/en.json'),
      import('../translations/es.json'),
      import('../translations/fr.json'),
      import('../translations/de.json')
    ]);
    
    translations.en = enTranslations.default;
    translations.es = esTranslations.default;
    translations.fr = frTranslations.default;
    translations.de = deTranslations.default;
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
      
      // Load saved language preference
      const savedLanguage = localStorage.getItem('yourfocus-language') as Language;
      if (savedLanguage && ['en', 'es', 'fr', 'de'].includes(savedLanguage)) {
        setLanguage(savedLanguage);
      }
      
      setIsLoaded(true);
    };

    initTranslations();
  }, []);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('yourfocus-language', newLanguage);
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
    { code: 'de', name: 'Deutsch' }
  ];

  return {
    t,
    language,
    changeLanguage,
    getLanguageOptions,
    isLoaded
  };
};