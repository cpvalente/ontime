import axios from 'axios';
import { URLPreset } from 'ontime-types';

import { apiEntryUrl } from './constants';

const urlPresetsPath = `${apiEntryUrl}/url-presets`;

/**
 * HTTP request to retrieve aliases
 */
export async function getUrlPresets(): Promise<URLPreset[]> {
  const res = await axios.get(urlPresetsPath);
  return res.data;
}

/**
 * HTTP request to mutate aliases
 */
export async function postUrlPresets(data: URLPreset[]): Promise<URLPreset[]> {
  return axios.post(urlPresetsPath, data);
}
