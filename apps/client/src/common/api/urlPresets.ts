import axios from 'axios';
import { URLPreset } from 'ontime-types';

import { apiEntryUrl } from './constants';

const urlPresetsPath = `${apiEntryUrl}/url-presets`;

/**
 * HTTP request to retrieve all presets
 */
export async function getUrlPresets(): Promise<URLPreset[]> {
  const res = await axios.get(urlPresetsPath);
  return res.data;
}

/**
 * HTTP request to add a preset
 */
export async function postUrlPreset(data: URLPreset): Promise<URLPreset[]> {
  return (await axios.post(urlPresetsPath, data)).data;
}

/**
 * HTTP request to edit a preset
 */
export async function putUrlPreset(alias: string, data: URLPreset): Promise<URLPreset[]> {
  return (await axios.put(`${urlPresetsPath}/${alias}`, data)).data;
}

/**
 * HTTP request to delete a preset
 */
export async function deleteUrlPreset(alias: string): Promise<URLPreset[]> {
  return (await axios.delete(`${urlPresetsPath}/${alias}`)).data;
}
