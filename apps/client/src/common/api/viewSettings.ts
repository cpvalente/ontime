import axios from 'axios';
import type { ViewSettings } from 'ontime-types';

import { ontimeQueryClient } from '../../common/queryClient';

import { apiEntryUrl, VIEW_SETTINGS } from './constants';
const viewSettingsPath = apiEntryUrl + '/view-settings';

let etag: string | null = '-1';

export async function getViewSettings() {
  const res = await axios.get(viewSettingsPath, { headers: { ['if-none-match']: etag } });
  if (res.status === 304) return ontimeQueryClient.getQueryData(VIEW_SETTINGS);
  etag = res.headers.etag;
  return res.data;
}

export async function postViewSettings(data: ViewSettings) {
  await ontimeQueryClient.cancelQueries({ queryKey: VIEW_SETTINGS });
  const res = await axios.post(viewSettingsPath, data);
  etag = res.headers.etag;
  return res.data as ViewSettings;
}
