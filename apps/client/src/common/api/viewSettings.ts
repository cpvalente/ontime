import axios from 'axios';
import type { ViewSettings } from 'ontime-types';

import { apiEntryUrl } from './constants';
const viewSettingsPath = apiEntryUrl + '/view-settings';

export async function getViewSettings() {
  const res = await axios.get(viewSettingsPath);
  return res.data;
}

export async function postViewSettings(data: ViewSettings) {
  const res = await axios.post(viewSettingsPath, data);
  return res.data as ViewSettings;
}
