import axios, { AxiosResponse } from 'axios';
import { CustomFields, Rundown, RundownSummary } from 'ontime-types';
import { ImportMap } from 'ontime-utils';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';
import { axiosConfig } from './requestTimeouts';
import { downloadBlob } from './utils';

const excelPath = `${apiEntryUrl}/excel`;

/**
 * upload Excel file to server
 * @return string - file ID op the uploaded file
 */
export async function upload(file: File, requestOptions?: RequestOptions): Promise<string[]> {
  const formData = new FormData();
  formData.append('excel', file);
  const response = await axios.post(`${excelPath}/upload`, formData, {
    signal: requestOptions?.signal,
    timeout: requestOptions?.timeout ?? axiosConfig.longTimeout,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

type PreviewSpreadsheetResponse = {
  rundown: Rundown;
  customFields: CustomFields;
  summary: RundownSummary;
};
export async function importRundownPreview(
  options: ImportMap,
  requestOptions?: RequestOptions,
): Promise<PreviewSpreadsheetResponse> {
  const response: AxiosResponse<PreviewSpreadsheetResponse> = await axios.post(
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
