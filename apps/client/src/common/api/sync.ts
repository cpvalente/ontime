import axios from 'axios';
import { SyncClientList, SyncHostConnectionRequest } from 'ontime-types';

import { apiEntryUrl } from './constants';

const syncPath = `${apiEntryUrl}/sync`;

/**
 * HTTP request to retrieve application info
 */
export async function getSyncList(): Promise<SyncClientList> {
  const res = await axios.get(`${syncPath}/list`);
  return res.data;
}

export async function connectToHost(settings: SyncHostConnectionRequest) {
  await axios.post(`${syncPath}/connect`, settings);
}
