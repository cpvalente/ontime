import axios from 'axios';
import { TranslationObject } from 'translation/languages/en';

import { apiEntryUrl, customTranslationsURL } from './constants';

const assetsPath = `${apiEntryUrl}/assets`;

/**
 * HTTP request to get css contents
 */
export async function getCSSContents(): Promise<string> {
  const res = await axios.get(`${assetsPath}/css`);
  return res.data;
}

/**
 * HTTP request to post css contents
 */
export async function postCSSContents(css: string): Promise<void> {
  await axios.post(`${assetsPath}/css`, {
    css,
  });
}

/**
 * HTTP request to restore default css
 */
export async function restoreCSSContents(): Promise<string> {
  const res = await axios.post(`${assetsPath}/css/restore`);
  return res.data;
}

/**
 * HTTP request to get user translation
 */
export async function getUserTranslation(): Promise<TranslationObject> {
  const res = await axios.get(customTranslationsURL);
  return res.data;
}

/**
 * HTTP request to post user translation
 */
export async function postUserTranslation(translation: TranslationObject): Promise<void> {
  await axios.post(`${assetsPath}/translations`, {
    translation,
  });
}
