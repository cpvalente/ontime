import { createContext, PropsWithChildren, useCallback, useContext } from 'react';

import useSettings from '../common/hooks-query/useSettings';

import { langDe } from './languages/de';
import { langEn } from './languages/en';
import { langEs } from './languages/es';
import { langFr } from './languages/fr';
import { langIt } from './languages/it';
import { langNo } from './languages/no';
import { langPt } from './languages/pt';
import { langSv } from './languages/sv';
import { langPl } from './languages/pl';

const translationsList = {
  en: langEn,
  es: langEs,
  fr: langFr,
  it: langIt,
  de: langDe,
  no: langNo,
  pt: langPt,
  sv: langSv,
  pl: langPl,
};

interface TranslationContextValue {
  getLocalizedString: (key: keyof typeof langEn, lang?: string) => string;
}

export const TranslationContext = createContext<TranslationContextValue>({
  getLocalizedString: () => '',
});

export const TranslationProvider = ({ children }: PropsWithChildren) => {
  const { data } = useSettings();

  const getLocalizedString = useCallback(
    (key: keyof typeof langEn, lang = data?.language || 'en'): string => {
      if (lang in translationsList) {
        if (key in translationsList[lang as keyof typeof translationsList]) {
          return translationsList[lang as keyof typeof translationsList][key];
        }
      }
      return langEn[key];
    },
    [data?.language],
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
