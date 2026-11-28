import axios from 'axios';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';

const appStatePath = `${apiEntryUrl}/app-state`;

/**
 * HTTP request to retrieve whether the welcome dialog shows on startup
 */
export async function getShowWelcomeDialog(options?: RequestOptions): Promise<boolean> {
  const res = await axios.get<{ show: boolean }>(`${appStatePath}/welcome-dialog`, { signal: options?.signal });
  return res.data.show;
}

/**
 * Allows setting the welcome modal dialog state from the clients
 */
export async function postShowWelcomeDialog(show: boolean): Promise<boolean> {
  const res = await axios.post<{ show: boolean }>(`${appStatePath}/welcome-dialog`, { show });
  return res.data.show;
}
