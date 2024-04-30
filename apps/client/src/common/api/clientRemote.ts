import axios from 'axios';

import { serverURL } from './constants';

const clientPath = `${serverURL}/api/wsclient`;

/**
 * HTTP GET ws client list
 */
export async function getClients(): Promise<string[]> {
  const res = await axios.get(`${clientPath}/list`);
  return res.data.payload;
}

/**
 * HTTP GET
 */
export async function setClientIdentify(id: string, state: boolean): Promise<void> {
  await axios.get(`${clientPath}/identify?target=${id}&state=${state}`);
}

/**
 * HTTP GET
 */
export async function setClientRedirect(id: string, path: string): Promise<void> {
  await axios.get(`${clientPath}/redirect?target=${id}&path=${path}`);
}
