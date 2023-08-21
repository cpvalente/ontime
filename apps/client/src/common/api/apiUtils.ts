import axios, { AxiosError } from 'axios';
import { LogLevel } from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';

import { addLog } from '../stores/logger';
import { nowInMillis } from '../utils/time';

export function logAxiosError(prepend: string, error: unknown) {
  let message;
  if (axios.isAxiosError(error)) {
    const statusText = (error as AxiosError).response?.statusText ?? '';
    const data = (error as AxiosError).response?.data ?? '';
    message = `${prepend} ${statusText}: ${data}`;
  } else {
    message = `${prepend}: ${error}`;
  }

  addLog({
    id: generateId(),
    origin: 'SERVER',
    time: millisToString(nowInMillis()),
    level: LogLevel.Error,
    text: message,
  });
}
