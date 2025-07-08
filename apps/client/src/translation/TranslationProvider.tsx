import { createContext, PropsWithChildren, useCallback, useContext } from 'react';

import useSettings from '../common/hooks-query/useSettings';

import { langDe } from './languages/de';
import { langEn } from './languages/en';
import { langEs } from './languages/es';
import { langFr } from './languages/fr';
import { langIt } from './languages/it';
import { langPt } from './languages/pt';

const translationsList = {
  en: langEn,
  es: langEs,
  fr: langFr,
  it: langIt,
  de: langDe,
  pt: langPt,
};

export type TranslationKey = keyof typeof langEn;

interface TranslationContextValue {
  getLocalizedString: (key: TranslationKey, lang?: string) => string;
}

const TranslationContext = createContext<TranslationContextValue>({
  getLocalizedString: () => '',
});

export const TranslationProvider = ({ children }: PropsWithChildren) => {
  const { data } = useSettings();

  const getLocalizedString = useCallback(
    (key: TranslationKey, lang = data?.language || 'en'): string => {
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
