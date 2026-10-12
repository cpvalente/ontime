import axios from 'axios';
import type { Log } from 'ontime-types';

import { apiEntryUrl } from './constants';
import { axiosConfig } from './requestTimeouts';
import { downloadBlob } from './utils';

const logsPath = `${apiEntryUrl}/logs`;

export async function getLogEntries(signal?: AbortSignal): Promise<Log[]> {
  const response = await axios.get<Log[]>(`${logsPath}/entries`, { signal, timeout: axiosConfig.shortTimeout });
  return response.data;
}

export async function downloadSessionLog(session: 'current' | 'previous'): Promise<void> {
  const response = await axios.get(`${logsPath}/${session}`, {
    timeout: axiosConfig.longTimeout,
    responseType: 'blob',
  });

  downloadBlob(response.data, session === 'current' ? 'ontime.log' : 'ontime.previous.log');
}
