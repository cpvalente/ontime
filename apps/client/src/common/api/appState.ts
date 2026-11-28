import axios from 'axios';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';

const appStatePath = `${apiEntryUrl}/app-state`;

export async function getShowWelcomeDialog(options?: RequestOptions): Promise<boolean> {
  const res = await axios.get<{ show: boolean }>(`${appStatePath}/welcome-dialog`, { signal: options?.signal });
  return res.data.show;
}

export async function postShowWelcomeDialog(show: boolean): Promise<boolean> {
  const res = await axios.post<{ show: boolean }>(`${appStatePath}/welcome-dialog`, { show });
  return res.data.show;
}
