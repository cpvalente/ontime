import axios, { AxiosResponse } from 'axios';
import { DatabaseModel, MessageResponse, ProjectData, ProjectFileListResponse, QuickStartData } from 'ontime-types';

import { makeTable } from '../../views/cuesheet/cuesheet.utils';
import { makeCSVFromArrayOfArrays } from '../utils/csv';

import { apiEntryUrl } from './constants';
import { createBlob, downloadBlob } from './utils';

const dbPath = `${apiEntryUrl}/db`;

/**
 * HTTP request to the current DB
 */
export function getDb(filename: string): Promise<AxiosResponse<DatabaseModel>> {
  return axios.post(`${dbPath}/download`, { filename });
}

/**
 * Request download of the current project file
 * @param fileName
 */
export async function downloadProject(fileName: string) {
  try {
    const { data, name } = await fileDownload(fileName);

    const fileContent = JSON.stringify(data, null, 2);

    const blob = createBlob(fileContent, 'application/json;charset=utf-8;');
    downloadBlob(blob, `${name}.json`);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Request download of the current rundown as a CSV file
 * @param fileName
 */
export async function downloadCSV(fileName: string = 'rundown') {
  try {
    const { data, name } = await fileDownload(fileName);
    const { project, rundown, customFields } = data;

    const sheetData = makeTable(project, rundown, customFields);
    const fileContent = makeCSVFromArrayOfArrays(sheetData);

    const blob = createBlob(fileContent, 'text/csv;charset=utf-8;');
    downloadBlob(blob, `${name}.csv`);
  } catch (error) {
    console.error(error);
  }
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
 * HTTP request to create a project file
 */
export async function quickProject(data: QuickStartData): Promise<MessageResponse> {
  const res = await axios.post(`${dbPath}/quick`, data);
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
 * HTTP request to load the demo project file
 */
export async function loadDemo(): Promise<MessageResponse> {
  const res = await axios.post(`${dbPath}/demo`);
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
 * Utility function gets project from db
 * @param fileName
 * @returns
 */
async function fileDownload(fileName: string): Promise<{ data: DatabaseModel; name: string }> {
  const response = await getDb(fileName);

  const headerLine = response.headers['Content-Disposition'];

  // try and get the filename from the response
  let name = fileName;
  if (headerLine != null) {
    const startFileNameIndex = headerLine.indexOf('"') + 1;
    const endFileNameIndex = headerLine.lastIndexOf('"');
    name = headerLine.substring(startFileNameIndex, endFileNameIndex);
  }

  return { data: response.data, name };
}

