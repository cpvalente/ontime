import axios, { AxiosResponse } from 'axios';
import type {
  SpreadsheetPreviewResponse,
  SpreadsheetWorksheetMetadata,
  SpreadsheetWorksheetOptions,
} from 'ontime-types';
import { ImportMap } from 'ontime-utils';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';
import { axiosConfig } from './requestTimeouts';
import { downloadBlob } from './utils';

const excelPath = `${apiEntryUrl}/excel`;

/**
 * upload Excel file to server
 * Uploads an Excel file and returns worksheet names plus metadata for the initial worksheet.
 */
export async function upload(file: File, requestOptions?: RequestOptions): Promise<SpreadsheetWorksheetOptions> {
  const formData = new FormData();
  formData.append('excel', file);
  const response: AxiosResponse<SpreadsheetWorksheetOptions> = await axios.post(`${excelPath}/upload`, formData, {
    signal: requestOptions?.signal,
    timeout: requestOptions?.timeout ?? axiosConfig.longTimeout,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function importRundownPreview(
  options: ImportMap,
  requestOptions?: RequestOptions,
): Promise<SpreadsheetPreviewResponse> {
  const response: AxiosResponse<SpreadsheetPreviewResponse> = await axios.post(
    `${excelPath}/preview`,
    {
      options,
    },
    {
      signal: requestOptions?.signal,
      timeout: requestOptions?.timeout ?? axiosConfig.longTimeout,
    },
  );
  return response.data;
}

export async function getWorksheetMetadata(
  worksheet: string,
  requestOptions?: RequestOptions,
): Promise<SpreadsheetWorksheetMetadata> {
  const response: AxiosResponse<SpreadsheetWorksheetMetadata> = await axios.post(
    `${excelPath}/metadata`,
    { worksheet },
    {
      signal: requestOptions?.signal,
      timeout: requestOptions?.timeout ?? axiosConfig.longTimeout,
    },
  );

  return response.data;
}

/**
 * Downloads a xlsx representation of the rundown from the server
 */
export async function downloadAsExcel(rundownId: string, fileName?: string, requestOptions?: RequestOptions) {
  try {
    const response = await axios.get(`${excelPath}/${rundownId}/export`, {
      signal: requestOptions?.signal,
      timeout: requestOptions?.timeout ?? axiosConfig.longTimeout,
      responseType: 'blob',
    });

    downloadBlob(response.data, `${fileName ?? 'Ontime_rundown'}.xlsx`);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}
