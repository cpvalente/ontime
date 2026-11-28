import axios, { AxiosResponse } from 'axios';
import type { PortInfo } from 'ontime-types';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';

const serverPortPath = `${apiEntryUrl}/server-port`;

export async function getServerPort(options?: RequestOptions): Promise<PortInfo> {
  const res = await axios.get(serverPortPath, { signal: options?.signal });
  return res.data;
}

export async function postServerPort(serverPort: number): Promise<AxiosResponse<PortInfo>> {
  return axios.post(serverPortPath, { serverPort });
}
