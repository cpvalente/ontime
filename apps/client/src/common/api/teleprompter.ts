import axios from 'axios';
import type { TeleprompterScript, TeleprompterSettings } from 'ontime-types';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';

const teleprompterPath = `${apiEntryUrl}/teleprompter`;

/**
 * HTTP request to fetch the teleprompter script
 */
export async function getTeleprompterScript(options?: RequestOptions): Promise<TeleprompterScript> {
  const res = await axios.get(`${teleprompterPath}/script`, { signal: options?.signal });
  return res.data;
}

/**
 * HTTP request to fetch the shared teleprompter settings
 */
export async function getTeleprompterSettings(options?: RequestOptions): Promise<TeleprompterSettings> {
  const res = await axios.get(`${teleprompterPath}/settings`, { signal: options?.signal });
  return res.data;
}

/**
 * HTTP request to change the shared teleprompter settings
 */
export async function postTeleprompterSettings(data: TeleprompterSettings): Promise<TeleprompterSettings> {
  const res = await axios.post(`${teleprompterPath}/settings`, data);
  return res.data;
}
