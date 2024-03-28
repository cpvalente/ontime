import axios, { AxiosResponse } from 'axios';
import { HttpSettings } from 'ontime-types';

import { apiEntryUrl } from './constants';

const httpPath = `${apiEntryUrl}/http`;

/**
 * HTTP request to retrieve http settings
 */
export async function getHTTP(): Promise<HttpSettings> {
  const res = await axios.get(httpPath);
  return res.data;
}

/**
 * HTTP request to mutate http settings
 */
export async function postHTTP(data: HttpSettings): Promise<AxiosResponse<HttpSettings>> {
  return axios.post(httpPath, data);
}
