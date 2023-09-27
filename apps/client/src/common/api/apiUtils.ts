import axios, { AxiosError } from 'axios';
import { LogLevel } from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';

import { addLog } from '../stores/logger';
import { nowInMillis } from '../utils/time';

export function maybeAxiosError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const statusText = (error as AxiosError).response?.statusText ?? '';
    let data = (error as AxiosError).response?.data ?? '';
    if (typeof data === 'object') {
      // TODO: use error instead, when migrated
      if ('message' in data) {
        data = JSON.stringify(data.message);
      } else {
        data = JSON.stringify(data);
      }
    }
    return `${statusText}: ${data}`;
  } else {
    return error as string;
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
