import axios, { AxiosError } from 'axios';
import { LogLevel } from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';

import { makeCSV, makeTable } from '../../features/cuesheet/cuesheetUtils';
import { ontimeQueryClient } from '../queryClient';
import { addLog } from '../stores/logger';
import { nowInMillis } from '../utils/time';

/**
 * Utility unrwap a potential axios error
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
  } else {
    if (typeof error !== 'string') {
      return JSON.stringify(error);
    }
    return error;
  }
}

/**
 * Utility unrwaps a potential axios error and sends to logger
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
  await ontimeQueryClient.invalidateQueries();
}

type FileOptions = {
  name: string;
  type: string;
};

type BlobOptions = {
  type: string;
};

/**
 * Gets DB from backend and prepares a file to be downloaded
 * @param url
 * @param fileOptions
 * @param blobOptions
 * @returns
 */
export default async function fileDownload(url: string, fileOptions: FileOptions, blobOptions: BlobOptions) {
  const response = await axios({
    url: `${url}/db`,
    method: 'GET',
  });

  const headerLine = response.headers['Content-Disposition'];
  let { name: fileName } = fileOptions;
  const { type: fileType } = fileOptions;
  const { project, rundown, customFields } = response.data;

  // try and get the filename from the response
  if (headerLine != null) {
    const startFileNameIndex = headerLine.indexOf('"') + 1;
    const endFileNameIndex = headerLine.lastIndexOf('"');
    fileName = headerLine.substring(startFileNameIndex, endFileNameIndex);
  }

  let fileContent = '';

  if (fileType === 'json') {
    fileContent = JSON.stringify(response.data);
    fileName += '.json';
  }

  if (fileType === 'csv') {
    const sheetData = makeTable(project, rundown, customFields);
    fileContent = makeCSV(sheetData);
    fileName += '.csv';
  }

  const blob = new Blob([fileContent], { type: blobOptions.type });
  const downloadUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', downloadUrl);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  // Clean up the URL.createObjectURL to release resources
  URL.revokeObjectURL(downloadUrl);
  return;
}

