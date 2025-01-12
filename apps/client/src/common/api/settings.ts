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
 * Allows setting the welcome modal dialog state from the clients
 */
export async function postShowWelcomeDialog(show: boolean) {
  axios.post(`${settingsPath}/welcomedialog`, { show });
}
