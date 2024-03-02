import axios from 'axios';
import { Alias } from 'ontime-types';

import { apiEntryUrl } from './constants';

const aliasesPath = `${apiEntryUrl}/aliases`;

/**
 * HTTP request to retrieve aliases
 */
export async function getAliases(): Promise<Alias[]> {
  const res = await axios.get(aliasesPath);
  return res.data;
}

/**
 * HTTP request to mutate aliases
 */
export async function postAliases(data: Alias[]): Promise<Alias[]> {
  return axios.post(aliasesPath, data);
}
