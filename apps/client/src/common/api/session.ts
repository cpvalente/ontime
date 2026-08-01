import axios from 'axios';
import { GetInfo, LinkOptions, SessionStats } from 'ontime-types';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';

const sessionPath = `${apiEntryUrl}/session`;

/**
 * HTTP request to retrieve application info
 */
export async function getInfo(options?: RequestOptions): Promise<GetInfo> {
  const res = await axios.get(`${sessionPath}/info`, { signal: options?.signal });
  return res.data;
}

/**
 * HTTP request to retrieve runtime session statistics
 */
export async function getSessionStats(options?: RequestOptions): Promise<SessionStats> {
  const res = await axios.get(`${sessionPath}/`, { signal: options?.signal });
  return res.data;
}

/**
 * HTTP request to get a pre-authenticated URL
 */
export async function generateUrl(options: LinkOptions & { baseUrl: string; path: string }): Promise<string> {
  const res = await axios.post(`${sessionPath}/url`, options);
  return res.data.url;
}
