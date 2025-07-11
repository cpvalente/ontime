import axios from 'axios';
import { TranslationObject } from 'translation/languages/en';

import { apiEntryUrl } from './constants';

const translationsPath = `${apiEntryUrl}/translations`;

/**
 * HTTP request to get user translation
 */
export async function getUserTranslation(): Promise<TranslationObject> {
  const res = await axios.get(`${translationsPath}`);
  return res.data;
}

/**
 * HTTP request to post user translation
 */
export async function postUserTranslation(translation: TranslationObject): Promise<void> {
  await axios.post(`${translationsPath}`, {
    translation,
  });
}
