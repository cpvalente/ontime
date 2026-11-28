import axios from 'axios';
import type { Settings, SettingsPatch } from 'ontime-types';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';

const settingsPath = `${apiEntryUrl}/settings`;

/**
 * HTTP request to retrieve application settings
 */
export async function getSettings(options?: RequestOptions): Promise<Settings> {
  const res = await axios.get(settingsPath, { signal: options?.signal });
  return res.data;
}

/**
 * HTTP request to change some of the application settings, returns all settings
 */
export async function patchSettings(patch: SettingsPatch): Promise<Settings> {
  const res = await axios.patch<Settings>(settingsPath, patch);
  return res.data;
}
