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
