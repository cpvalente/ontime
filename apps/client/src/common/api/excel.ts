import axios, { AxiosResponse } from 'axios';
import { CustomFields, OntimeRundown } from 'ontime-types';
import { ImportMap } from 'ontime-utils';

import { apiEntryUrl } from './constants';

const excelPath = `${apiEntryUrl}/excel`;

type PreviewSpreadsheetResponse = {
  rundown: OntimeRundown;
  customFields: CustomFields;
};

/**
 * upload Excel file to server
 * @return { fileId: string } - file ID op the uploaded file
 */
export async function upload(file: File): Promise<{ fileId: string }> {
  const formData = new FormData();
  formData.append('excel', file);
  const response: AxiosResponse<{ fileId: string }> = await axios.post(`${excelPath}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Get Worksheet names
 * @return {string[]} - array of available worksheets
 */
export async function getWorksheetNames(fileId: string): Promise<{ names: string[] }> {
  const response: AxiosResponse<{ names: string[] }> = await axios.get(`${excelPath}/${fileId}/worksheets`);
  return response.data;
}

export async function importRundownPreview(fileId: string, options: ImportMap): Promise<PreviewSpreadsheetResponse> {
  const response: AxiosResponse<PreviewSpreadsheetResponse> = await axios.post(`${excelPath}/${fileId}/preview`, {
    options,
  });
  return response.data;
}
