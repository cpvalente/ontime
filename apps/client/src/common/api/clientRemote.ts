import axios from 'axios';

import { serverURL } from './constants';

const clientPath = `${serverURL}/api/wsclient`;

/**
 * HTTP request to retrieve aliases
 */
export async function getClients(): Promise<string[]> {
  const res = await axios.get(`${clientPath}/list`);
  return res.data.payload;
}
