import React, { createContext, useCallback, useContext } from 'react';

import useSettings from '@/common/hooks-query/useSettings';
import { langDe } from '@/translation/languages/de';
import { langEn } from '@/translation/languages/en';
import { langEs } from '@/translation/languages/es';
import { langNo } from '@/translation/languages/no';
import { langPt } from '@/translation/languages/pt';
import { langSv } from '@/translation/languages/sv';

const translationsList = {
  en: langEn,
  es: langEs,
  de: langDe,
  no: langNo,
  pt: langPt,
  sv: langSv,
};

const DEFAULT_LANGUAGE = 'en';
export const TranslationContext = createContext(undefined);

export const TranslationProvider = ({ children }) => {
  const { data } = useSettings();

  const getLocalizedString = useCallback(
    (key, lang = data.language) => {
      if (key in translationsList[lang]) {
        return translationsList[lang][key];
      } else if (lang !== DEFAULT_LANGUAGE) {
        return getLocalizedString(key, 'en');
      }
    },
    [data.language],
  );

  const contextValue = {
    getLocalizedString,
  };

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
};

export const useTranslation = () => {
  const { getLocalizedString } = useContext(TranslationContext);
  return { getLocalizedString };
};
