import { createContext, PropsWithChildren, useCallback, useContext } from 'react';

import { postUserTranslation } from '../common/api/assets';
import { useCustomTranslation } from '../common/hooks-query/useCustomTranslation';
import useSettings from '../common/hooks-query/useSettings';

import { langDe } from './languages/de';
import { langEn, TranslationObject } from './languages/en';
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
  userTranslation: TranslationObject;
  getLocalizedString: (key: TranslationKey, lang?: string) => string;
  postUserTranslation: (translation: TranslationObject) => Promise<void>;
}

const TranslationContext = createContext<TranslationContextValue>({
  userTranslation: langEn,
  getLocalizedString: () => '',
  postUserTranslation: async () => {},
});

export const TranslationProvider = ({ children }: PropsWithChildren) => {
  const { data } = useSettings();
  const { data: translationData } = useCustomTranslation();

  const getLocalizedString = useCallback(
    (key: TranslationKey, lang = data?.language || 'en'): string => {
      if (lang in translationsList) {
        if (key in translationsList[lang as keyof typeof translationsList]) {
          return translationsList[lang as keyof typeof translationsList][key];
        }
      } else if (lang === 'custom') {
        return translationData[key];
      }
      return langEn[key];
    },
    [data?.language, translationData],
  );

  const contextValue = {
    userTranslation: translationData,
    getLocalizedString,
    postUserTranslation,
  };

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
};

export const useTranslation = () => {
  const { userTranslation, getLocalizedString, postUserTranslation } = useContext(TranslationContext);
  return { userTranslation, getLocalizedString, postUserTranslation };
};
