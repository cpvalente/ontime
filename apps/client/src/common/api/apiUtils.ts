import axios, { AxiosError } from 'axios';
import { LogLevel } from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';

import { ontimeQueryClient } from '../queryClient';
import { addLog } from '../stores/logger';
import { nowInMillis } from '../utils/time';

export function maybeAxiosError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const statusText = (error as AxiosError).response?.statusText ?? '';
    let data = (error as AxiosError).response?.data ?? '';
    if (typeof data === 'object') {
      if ('message' in data) {
        data = JSON.stringify(data.message);
      } else {
        data = JSON.stringify(data);
      }
    }
    return `${statusText}: ${data}`;
  } else {
    if (typeof error !== 'string') {
      return JSON.stringify(error);
    }
    return error;
  }
}

export function logAxiosError(prepend: string, error: unknown) {
  const message = `${prepend}: ${maybeAxiosError(error)}`;

  addLog({
    id: generateId(),
    origin: 'SERVER',
    time: millisToString(nowInMillis()),
    level: LogLevel.Error,
    text: message,
  });
}

/**
 * Utility function invalidates react-query caches
 */
export async function invalidateAllCaches() {
  await ontimeQueryClient.invalidateQueries({ queryKey: ['project'] });
  await ontimeQueryClient.invalidateQueries({ queryKey: ['aliases'] });
  await ontimeQueryClient.invalidateQueries({ queryKey: ['userFields'] });
  await ontimeQueryClient.invalidateQueries({ queryKey: ['rundown'] });
  await ontimeQueryClient.invalidateQueries({ queryKey: ['appinfo'] });
  await ontimeQueryClient.invalidateQueries({ queryKey: ['oscSettings'] });
  await ontimeQueryClient.invalidateQueries({ queryKey: ['appSettings'] });
  await ontimeQueryClient.invalidateQueries({ queryKey: ['viewSettings'] });
}
