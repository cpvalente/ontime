import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';

import { getUserTranslation, postUserTranslation } from '../common/api/translation';
import useSettings from '../common/hooks-query/useSettings';

import { langDe } from './languages/de';
import { langEn, TranslationObject } from './languages/en';
import { langEs } from './languages/es';
import { langFr } from './languages/fr';
import { langHu } from './languages/hu';
import { langIt } from './languages/it';
import { langNo } from './languages/no';
import { langPl } from './languages/pl';
import { langPt } from './languages/pt';
import { langSv } from './languages/sv';
import { langZhCn } from './languages/zh';

const translationsList = {
  en: langEn,
  es: langEs,
  fr: langFr,
  hu: langHu,
  it: langIt,
  de: langDe,
  no: langNo,
  pt: langPt,
  sv: langSv,
  pl: langPl,
  zh: langZhCn,
};

export type TranslationKey = keyof typeof langEn;

interface TranslationContextValue {
  userTranslation: TranslationObject;
  getLocalizedString: (key: TranslationKey, lang?: string) => string;
  postUserTranslation: (translation: TranslationObject) => Promise<void>;
  refetchTranslation: () => Promise<void>;
}

const TranslationContext = createContext<TranslationContextValue>({
  userTranslation: langEn,
  getLocalizedString: () => '',
  postUserTranslation: async () => {},
  refetchTranslation: async () => {},
});

export const TranslationProvider = ({ children }: PropsWithChildren) => {
  const { data } = useSettings();
  const [userTranslation, setUserTranslation] = useState<TranslationObject>(langEn);

  const getLocalizedString = useCallback(
    (key: TranslationKey, lang = data?.language || 'en'): string => {
      if (lang in translationsList) {
        if (key in translationsList[lang as keyof typeof translationsList]) {
          return translationsList[lang as keyof typeof translationsList][key];
        }
      } else if (lang === 'custom') {
        return userTranslation[key];
      }
      return langEn[key];
    },
    [data?.language, userTranslation],
  );

  const fetchUserTranslation = async () => {
    try {
      const userTranslation = await getUserTranslation();
      setUserTranslation(userTranslation);
    } catch (_error) {
      /** no error handling for now */
    }
  };

  const contextValue = {
    userTranslation,
    getLocalizedString,
    postUserTranslation,
    refetchTranslation: fetchUserTranslation,
  };

  useEffect(() => {
    fetchUserTranslation();
  }, []);

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
};

export const useTranslation = () => {
  const { userTranslation, getLocalizedString, postUserTranslation, refetchTranslation } =
    useContext(TranslationContext);
  return { userTranslation, getLocalizedString, postUserTranslation, refetchTranslation };
};
