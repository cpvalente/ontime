import axios, { AxiosResponse } from 'axios';
import { CustomFields, Rundown } from 'ontime-types';
import { ImportMap } from 'ontime-utils';

import { apiEntryUrl } from './constants';
import { downloadBlob } from './utils';

const excelPath = `${apiEntryUrl}/excel`;

/**
 * upload Excel file to server
 * @return string - file ID op the uploaded file
 */
export async function upload(file: File) {
  const formData = new FormData();
  formData.append('excel', file);
  await axios.post(`${excelPath}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Get Worksheet names
 * @return string[] - array of available worksheets
 */
export async function getWorksheetNames(): Promise<string[]> {
  const response: AxiosResponse<string[]> = await axios.get(`${excelPath}/worksheets`);
  return response.data;
}

type PreviewSpreadsheetResponse = {
  rundown: Rundown;
  customFields: CustomFields;
};
export async function importRundownPreview(options: ImportMap): Promise<PreviewSpreadsheetResponse> {
  const response: AxiosResponse<PreviewSpreadsheetResponse> = await axios.post(`${excelPath}/preview`, {
    options,
  });
  return response.data;
}

/**
 * Downloads a xlsx representation of the rundown from the server
 */
export async function downloadAsExcel(rundownId: string, fileName?: string) {
  try {
    const response = await axios.get(`${excelPath}/${rundownId}/export`, {
      responseType: 'blob',
    });

    downloadBlob(response.data, `${fileName ?? 'Ontime_rundown'}.xlsx`);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}
