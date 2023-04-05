import React, { createContext, useContext, useState } from 'react';

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
  // Default language
  const [language, setLanguageState] = useState('en');

  const getLocalizedString = (key, lang = language) => {
    if (key in translationsList[lang]) {
      return translationsList[lang][key];
    } else if (lang !== DEFAULT_LANGUAGE) {
      /* If the key does not exist in the chosen language, try to load it in the default language. */
      return getLocalizedString(key, 'en');
    } else {
      /* We are here if the key does not exist in the default language. */
      return undefined;
    }
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
    getLocalizedString,
    setLanguage,
  };

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
};

export const useTranslation = () => {
  const { getLocalizedString, setLanguage } = useContext(TranslationContext);
  return { getLocalizedString, setLanguage };
};
