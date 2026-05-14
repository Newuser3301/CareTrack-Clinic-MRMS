import { createContext, useContext, useMemo, useState } from 'react';
import { languages, translations } from '../i18n/translations';

const LanguageContext = createContext(null);

const getNested = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => localStorage.getItem('caretrackLanguage') || 'uz');

  const setLanguage = (value) => {
    const nextLanguage = translations[value] ? value : 'uz';
    localStorage.setItem('caretrackLanguage', nextLanguage);
    setLanguageState(nextLanguage);
  };

  const value = useMemo(() => {
    const t = (key, fallback) => getNested(translations[language], key) || getNested(translations.uz, key) || fallback || key;
    return { language, languages, setLanguage, t };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
