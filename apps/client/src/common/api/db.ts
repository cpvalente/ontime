import axios, { AxiosResponse } from 'axios';
import {
  CustomFields,
  DatabaseModel,
  GetInfo,
  MessageResponse,
  OntimeRundown,
  ProjectData,
  ProjectFileListResponse,
} from 'ontime-types';
import { ImportMap } from 'ontime-utils';

import { apiEntryUrl } from './constants';
import fileDownload from './utils';

const dbPath = `${apiEntryUrl}/db`;

/**
 * HTTP request to download db in JSON format
 */
export async function downloadRundown(fileName?: string) {
  return fileDownload(
    dbPath,
    { name: fileName ?? 'rundown', type: 'json' },
    { type: 'application/json;charset=utf-8;' },
  );
}

/**
 * HTTP request to download db in CSV format
 */
export async function downloadCSV(fileName?: string) {
  return fileDownload(dbPath, { name: fileName ?? 'rundown', type: 'csv' }, { type: 'text/csv;charset=utf-8;' });
}

/**
 * HTTP request to upload project file
 */
export async function uploadProjectFile(file: File): Promise<MessageResponse> {
  const formData = new FormData();
  formData.append('project', file);
  const response = await axios.post(`${dbPath}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Make patch changes to the objects in the db
 */
export async function patchData(patchDb: Partial<DatabaseModel>): Promise<AxiosResponse<DatabaseModel>> {
  return await axios.patch(dbPath, patchDb);
}

/**
 * HTTP request to create a project file
 */
export async function createProject(
  project: Partial<
    ProjectData & {
      filename: string;
    }
  >,
): Promise<MessageResponse> {
  const res = await axios.post(`${dbPath}/new`, project);
  return res.data;
}

/**
 * HTTP request to get the list of available project files
 */
export async function getProjects(): Promise<ProjectFileListResponse> {
  const res = await axios.get(`${dbPath}/all`);
  return res.data;
}

/**
 * HTTP request to load a project file
 */
export async function loadProject(filename: string): Promise<MessageResponse> {
  const res = await axios.post(`${dbPath}/load`, {
    filename,
  });
  return res.data;
}

/**
 * HTTP request to duplicate a project file
 */
export async function duplicateProject(filename: string, newFilename: string): Promise<MessageResponse> {
  const url = `${dbPath}/${filename}/duplicate`;
  const decodedUrl = decodeURIComponent(url);
  const res = await axios.post(decodedUrl, {
    newFilename,
  });
  return res.data;
}

/**
 * HTTP request to rename a project file
 */
export async function renameProject(filename: string, newFilename: string): Promise<MessageResponse> {
  const url = `${dbPath}/${filename}/rename`;
  const decodedUrl = decodeURIComponent(url);
  const res = await axios.put(decodedUrl, {
    newFilename,
  });
  return res.data;
}

/**
 * HTTP request to delete a project file
 */
export async function deleteProject(filename: string): Promise<MessageResponse> {
  const url = `${dbPath}/${filename}`;
  const decodedUrl = decodeURIComponent(url);
  const res = await axios.delete(decodedUrl);
  return res.data;
}

/**
 * HTTP request to retrieve application info
 */
export async function getInfo(): Promise<GetInfo> {
  const res = await axios.get(`${dbPath}/info`);
  return res.data;
}

type PreviewSpreadsheetResponse = {
  rundown: OntimeRundown;
  customFields: CustomFields;
};

/**
 * Make patch changes to the objects in the db
 */
export async function importSpreadsheetPreview(file: File, options: ImportMap): Promise<PreviewSpreadsheetResponse> {
  const formData = new FormData();
  formData.append('spreadsheet', file);
  formData.append('options', JSON.stringify(options));

  const response: AxiosResponse<PreviewSpreadsheetResponse> = await axios.post(
    `${dbPath}/spreadsheet/preview`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}
