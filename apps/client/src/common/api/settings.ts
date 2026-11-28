import axios, { AxiosResponse } from 'axios';
import type { PortInfo, Settings, SettingsPatch } from 'ontime-types';

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

/**
 * HTTP request to retrieve whether the welcome dialog shows on startup
 */
export async function getShowWelcomeDialog(options?: RequestOptions): Promise<boolean> {
  const res = await axios.get<{ show: boolean }>(`${settingsPath}/welcomedialog`, { signal: options?.signal });
  return res.data.show;
}

/**
 * Allows setting the welcome modal dialog state from the clients
 */
export async function postShowWelcomeDialog(show: boolean): Promise<boolean> {
  const res = await axios.post<{ show: boolean }>(`${settingsPath}/welcomedialog`, { show });
  return res.data.show;
}

/**
 * HTTP request to retrieve server port
 */
export async function getServerPort(options?: RequestOptions): Promise<PortInfo> {
  const res = await axios.get(`${settingsPath}/serverport`, { signal: options?.signal });
  return res.data;
}

/**
 * HTTP request to set server port
 */
export async function postServerPort(serverPort: number): Promise<AxiosResponse<PortInfo>> {
  return axios.post(`${settingsPath}/serverport`, { serverPort });
}
