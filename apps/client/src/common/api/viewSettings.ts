import axios from 'axios';
import type { ViewSettings } from 'ontime-types';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';

const viewSettingsPath = `${apiEntryUrl}/view-settings`;

/**
 * HTTP request to fetch view settings
 * @returns
 */
export async function getViewSettings(options?: RequestOptions): Promise<ViewSettings> {
  const res = await axios.get(viewSettingsPath, { signal: options?.signal });
  return res.data;
}

/**
 * HTTP request to update view settings
 * needs to update entire objects, not just a patch
 */
export async function postViewSettings(data: ViewSettings): Promise<ViewSettings> {
  const res = await axios.post(viewSettingsPath, data);
  return res.data;
}
