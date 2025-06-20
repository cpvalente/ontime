import axios from 'axios';
import type { ViewSettings } from 'ontime-types';

import { ontimeQueryClient } from '../../common/queryClient';

import { apiEntryUrl, VIEW_SETTINGS } from './constants';
const viewSettingsPath = apiEntryUrl + '/view-settings';

export async function getViewSettings() {
  const res = await axios.get(viewSettingsPath);
  return res.data;
}

export async function postViewSettings(data: ViewSettings) {
  await ontimeQueryClient.cancelQueries({ queryKey: VIEW_SETTINGS });
  const res = await axios.post(viewSettingsPath, data);
  return res.data as ViewSettings;
}
