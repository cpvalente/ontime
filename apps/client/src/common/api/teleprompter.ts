import axios from 'axios';
import type { TeleprompterScript } from 'ontime-types';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';

const teleprompterPath = `${apiEntryUrl}/teleprompter`;

/**
 * HTTP request to fetch the teleprompter script
 * @param search - a view's own settings, or empty for the shared script
 */
export async function getTeleprompterScript(search: string, options?: RequestOptions): Promise<TeleprompterScript> {
  const res = await axios.get(`${teleprompterPath}/script${search}`, { signal: options?.signal });
  return res.data;
}
