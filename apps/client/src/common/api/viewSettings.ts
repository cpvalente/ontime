import axios from 'axios';
import { ViewSettings } from 'ontime-types';

import { apiEntryUrl } from './constants';

const viewSettingsPath = `${apiEntryUrl}/view-settings`;

/**
 * HTTP request to retrieve view settings
 */
export async function getView(): Promise<ViewSettings> {
  const res = await axios.get(viewSettingsPath);
  return res.data;
}

/**
 * HTTP request to mutate view settings
 */
export async function postViewSettings(data: ViewSettings) {
  return axios.post(viewSettingsPath, data);
}
