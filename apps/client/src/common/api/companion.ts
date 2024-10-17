import axios, { AxiosResponse } from 'axios';
import { CompanionSettings } from 'ontime-types';

import { apiEntryUrl } from './constants';

const companionPath = `${apiEntryUrl}/companion`;

/**
 * HTTP request to retrieve companion settings
 */
export async function getCompanion(): Promise<CompanionSettings> {
  const res = await axios.get(companionPath);
  return res.data;
}

/**
 * HTTP request to mutate companion settings
 */
export async function postCompanion(data: CompanionSettings): Promise<AxiosResponse<CompanionSettings>> {
  return axios.post(companionPath, data);
}
