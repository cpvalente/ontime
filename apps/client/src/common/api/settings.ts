import axios, { AxiosResponse } from 'axios';
import { Settings } from 'ontime-types';

import { apiEntryUrl } from './constants';

const settingsPath = `${apiEntryUrl}/settings`;

/**
 * HTTP request to retrieve application settings
 */
export async function getSettings(): Promise<Settings> {
  const res = await axios.get(settingsPath);
  return res.data;
}

/**
 * HTTP request to mutate application settings
 */
export async function postSettings(data: Settings): Promise<AxiosResponse<Settings>> {
  return axios.post(settingsPath, data);
}

/**
 * HTTP request to mutate show welcome dialog
 * if no value is supplide will just return the current value
 */
export async function getShowWelcomeDialog(value?: boolean): Promise<AxiosResponse<{ show: boolean }>> {
  if (value === undefined) {
    return axios.get(`${settingsPath}/welcomedialog`);
  }
  return axios.get(`${settingsPath}/welcomedialog?${value ? 'show' : 'hide'}`);
}
