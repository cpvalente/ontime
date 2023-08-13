import axios, { AxiosError } from 'axios';
import { LogLevel } from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';

import { addLog } from '../stores/logger';
import { nowInMillis } from '../utils/time';

export function logAxiosError(prepend: string, error: unknown) {
  const message = axios.isAxiosError(error)
    ? `${prepend} ${(error as AxiosError).response?.statusText ?? ''}: ${(error as AxiosError).response?.data ?? ''}`
    : `${prepend}: ${error}`;

  addLog({
    id: generateId(),
    origin: 'SERVER',
    time: millisToString(nowInMillis()),
    level: LogLevel.Error,
    text: message,
  });
}
