import axios from 'axios';
import { GetInfo } from 'ontime-types';

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
export async function generateUrl(
  baseUrl: string,
  path: string,
  lock: boolean,
  lockMainFields: boolean,
  lockCustomFields: boolean,
  authenticate: boolean,
): Promise<string> {
  const res = await axios.post(`${sessionPath}/url`, {
    baseUrl,
    path,
    lock,
    lockMainFields,
    lockCustomFields,
    authenticate,
  });
  return res.data.url;
}
