import axios from 'axios';
import type { MaybeNumber, ViewSettings } from 'ontime-types';

import { apiEntryUrl, VIEW_SETTINGS } from './constants';
import { ontimeQueryClient } from '../queryClient';
const viewSettingsPath = apiEntryUrl + '/view-settings';

let revision = -1;

export function triggerRefetchViewSettings(newRevision: MaybeNumber) {
  if (revision != newRevision) {
    ontimeQueryClient.invalidateQueries({ queryKey: VIEW_SETTINGS });
  }
}

export async function getViewSettings() {
  const res = await axios.get(viewSettingsPath);
  revision = res.headers.revision;
  return res.data;
}

export async function postViewSettings(data: ViewSettings) {
  const res = await axios.post(viewSettingsPath, data);
  revision = res.headers.revision;
  return res.data as ViewSettings;
}
