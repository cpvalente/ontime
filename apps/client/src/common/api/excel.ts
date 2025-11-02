import axios, { AxiosResponse } from 'axios';
import { CustomFields, Rundown, RundownSummary } from 'ontime-types';
import { ImportMap } from 'ontime-utils';

import { apiEntryUrl } from './constants';
import { downloadBlob } from './utils';

const excelPath = `${apiEntryUrl}/excel`;

/**
 * upload Excel file to server
 * @return string - file ID op the uploaded file
 */
export async function upload(file: File): Promise<string[]> {
  const formData = new FormData();
  formData.append('excel', file);
  const response = await axios.post(`${excelPath}/upload`, formData, {
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
