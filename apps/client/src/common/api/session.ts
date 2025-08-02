import axios from 'axios';
import { GetInfo, LinkOptions } from 'ontime-types';

import { apiEntryUrl } from './constants';

const sessionPath = `${apiEntryUrl}/session`;

/**
 * HTTP request to retrieve application info
 */
export async function getInfo(): Promise<GetInfo> {
  const res = await axios.get(`${sessionPath}/info`);
  return res.data;
}

/**
 * HTTP request to get a pre-authenticated URL
 */
export async function generateUrl(options: LinkOptions & { baseUrl: string; path: string }): Promise<string> {
  const res = await axios.post(`${sessionPath}/url`, options);
  return res.data.url;
}
