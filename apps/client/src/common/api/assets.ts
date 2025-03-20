import axios from 'axios';
import { apiEntryUrl } from './constants';

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
