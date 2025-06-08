import axios, { AxiosError } from 'axios';
import { LogLevel } from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';

import { invalidateViewSettings } from '../../common/hooks-query/useViewSettings';
import { ontimeQueryClient } from '../queryClient';
import { addLog } from '../stores/logger';
import { nowInMillis } from '../utils/time';

/**
 * Utility unwrap a potential axios error
 * @param error
 * @returns
 */
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
  } else if (error instanceof Error) {
    return error.message;
  } else {
    if (typeof error !== 'string') {
      return JSON.stringify(error);
    }
    return error;
  }
}

/**
 * Utility unwraps a potential axios error and sends to logger
 * @param prepend
 * @param error
 */
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
  await invalidateViewSettings();
  await ontimeQueryClient.invalidateQueries();
}

/**
 * Creates blob from content
 * @param fileContent
 * @param type
 * @returns
 */
export function createBlob(fileContent: string, type: string): Blob {
  return new Blob([fileContent], { type });
}

/**
 * downloads a blob
 * @param downloadUrl
 * @param fileName
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', downloadUrl);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();

  // Clean up the URL.createObjectURL to release resources
  URL.revokeObjectURL(downloadUrl);
}
