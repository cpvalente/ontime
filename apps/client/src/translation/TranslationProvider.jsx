import React, { createContext, useCallback, useContext, useState } from 'react';

import { langDe } from '@/translation/languages/de';
import { langEn } from '@/translation/languages/en';

const translationsList = {
  en: langEn,
  de: langDe,
};
const ALLOWED_LANGUAGES = Object.keys(translationsList);
const DEFAULT_LANGUAGE = 'en';
export const TranslationContext = createContext(undefined);

export const TranslationProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  const getLocalizedString = useCallback(
    (key, lang = language) => {
      if (key in translationsList[lang]) {
        return translationsList[lang][key];
      } else if (lang !== DEFAULT_LANGUAGE) {
        return getLocalizedString(key, 'en');
      }
    },
    [language],
  );

  const setLanguage = useCallback((language) => {
    language = language.toLowerCase();
    if (ALLOWED_LANGUAGES.includes(language)) {
      setLanguageState(language);
      console.info(`Language set to ${language}`);
    } else {
      console.warn(`Language code ${language} does not exist.`);
    }
  }, []);

  const contextValue = {
    getLocalizedString,
    setLanguage,
  };

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
};

export const useTranslation = () => {
  const { getLocalizedString, setLanguage } = useContext(TranslationContext);
  return { getLocalizedString, setLanguage };
};
