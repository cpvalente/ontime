import axios, { AxiosResponse } from 'axios';
import { GetInfo, LinkOptions, PortInfo } from 'ontime-types';

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
 * HTTP request to get a pre-authenticated URL
 */
export async function generateUrl(options: LinkOptions & { baseUrl: string; path: string }): Promise<string> {
  const res = await axios.post(`${sessionPath}/url`, options);
  return res.data.url;
}

export async function getServerPort(options?: RequestOptions): Promise<PortInfo> {
  const res = await axios.get(`${sessionPath}/port`, { signal: options?.signal });
  return res.data;
}

export async function postServerPort(serverPort: number): Promise<AxiosResponse<PortInfo>> {
  return axios.post(`${sessionPath}/port`, { serverPort });
}

export async function getShowWelcomeDialog(options?: RequestOptions): Promise<boolean> {
  const res = await axios.get<{ show: boolean }>(`${sessionPath}/welcome-dialog`, { signal: options?.signal });
  return res.data.show;
}

export async function postShowWelcomeDialog(show: boolean): Promise<boolean> {
  const res = await axios.post<{ show: boolean }>(`${sessionPath}/welcome-dialog`, { show });
  return res.data.show;
}
