import axios, { AxiosResponse } from 'axios';
import { OSCSettings } from 'ontime-types';

import { apiEntryUrl } from './constants';

const oscPath = `${apiEntryUrl}/osc`;

/**
 * HTTP request to retrieve osc settings
 */
export async function getOSC(): Promise<OSCSettings> {
  const res = await axios.get(oscPath);
  return res.data;
}

/**
 * HTTP request to mutate osc settings
 */
export async function postOSC(data: OSCSettings): Promise<AxiosResponse<OSCSettings>> {
  return axios.post(oscPath, data);
}
