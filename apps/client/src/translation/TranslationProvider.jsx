import React, { createContext, useContext, useState } from 'react';

import { langDe } from '@/translation/languages/de';
import { langEn } from '@/translation/languages/en';

const ALLOWED_LANGUAGES = ['en', 'de'];

const translationsMap = new Map([
  ['en', langEn],
  ['de', langDe],
]);

export const TranslationContext = createContext(undefined);

export const TranslationProvider = ({ children }) => {
  // Default language
  const [language, setLanguageState] = useState('en');

  const getString = (key) => {
    return translationsMap.get(language).get(key);
  };

  const setLanguage = (language) => {
    language = language.toLowerCase();
    if (ALLOWED_LANGUAGES.includes(language)) {
      setLanguageState(language);
      console.info(`Language set to ${language}`);
    } else {
      console.warn(`Language code ${language} does not exist.`);
    }
  };

  const contextValue = {
    getString,
    setLanguage,
  };

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
};

export const useTranslation = () => {
  const { getString, setLanguage } = useContext(TranslationContext);
  return { getString, setLanguage };
};
