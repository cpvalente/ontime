import axios, { AxiosResponse } from 'axios';
import {
  Alias,
  AuthenticationStatus,
  CustomField,
  CustomFieldLabel,
  CustomFields,
  DatabaseModel,
  GetInfo,
  HttpSettings,
  MessageResponse,
  OntimeRundown,
  OSCSettings,
  ProjectData,
  ProjectFileListResponse,
  Settings,
  ViewSettings,
} from 'ontime-types';
import { ImportMap } from 'ontime-utils';

import { apiRepoLatest } from '../../externals';
import fileDownload from '../utils/fileDownload';

import { ontimeURL, projectDataURL } from './apiConstants';

/**
 * @description HTTP request to retrieve application settings
 * @return {Promise}
 */
export async function getSettings(): Promise<Settings> {
  const res = await axios.get(`${ontimeURL}/settings`);
  return res.data;
}

/**
 * @description HTTP request to mutate application settings
 * @return {Promise}
 */
export async function postSettings(data: Settings) {
  return axios.post(`${ontimeURL}/settings`, data);
}

/**
 * @description HTTP request to retrieve application info
 * @return {Promise}
 */
export async function getInfo(): Promise<GetInfo> {
  const res = await axios.get(`${ontimeURL}/info`);
  return res.data;
}

/**
 * @description HTTP request to retrieve view settings
 * @return {Promise}
 */
export async function getView(): Promise<ViewSettings> {
  const res = await axios.get(`${ontimeURL}/views`);
  return res.data;
}

/**
 * @description HTTP request to mutate view settings
 * @return {Promise}
 */
export async function postViewSettings(data: ViewSettings) {
  return axios.post(`${ontimeURL}/views`, data);
}

/**
 * @description HTTP request to retrieve aliases
 * @return {Promise}
 */
export async function getAliases(): Promise<Alias[]> {
  const res = await axios.get(`${ontimeURL}/aliases`);
  return res.data;
}

/**
 * @description HTTP request to mutate aliases
 * @return {Promise}
 */
export async function postAliases(data: Alias[]) {
  return axios.post(`${ontimeURL}/aliases`, data);
}

/**
 * @description HTTP request to retrieve osc settings
 * @return {Promise}
 */
export async function getOSC(): Promise<OSCSettings> {
  const res = await axios.get(`${ontimeURL}/osc`);
  return res.data;
}

/**
 * @description HTTP request to mutate osc settings
 * @return {Promise}
 */
export async function postOSC(data: OSCSettings): Promise<AxiosResponse<OSCSettings>> {
  return axios.post(`${ontimeURL}/osc`, data);
}

/**
 * @description HTTP request to retrieve http settings
 * @return {Promise}
 */
export async function getHTTP(): Promise<HttpSettings> {
  const res = await axios.get(`${ontimeURL}/http`);
  return res.data;
}

/**
 * @description HTTP request to mutate http settings
 * @return {Promise}
 */
export async function postHTTP(data: HttpSettings): Promise<AxiosResponse<HttpSettings>> {
  return axios.post(`${ontimeURL}/http`, data);
}

/**
 * @description HTTP request to download db in CSV format
 */
export const downloadCSV = (fileName?: string) => {
  return fileDownload(ontimeURL, { name: fileName ?? 'rundown', type: 'csv' }, { type: 'text/csv;charset=utf-8;' });
};

/**
 * @description HTTP request to download db in JSON format
 */
export const downloadRundown = (fileName?: string) => {
  return fileDownload(
    ontimeURL,
    { name: fileName ?? 'rundown', type: 'json' },
    { type: 'application/json;charset=utf-8;' },
  );
};

// TODO: should this be extracted to shared code?
export type ProjectFileImportOptions = {
  onlyRundown: boolean;
};

/**
 * @description HTTP request to upload events db
 * @return {Promise}
 */
export const uploadProjectFile = async (
  file: File,
  setProgress: (value: number) => void,
  options?: Partial<ProjectFileImportOptions>,
) => {
  const formData = new FormData();
  formData.append('userFile', file);

  const onlyRundown = Boolean(options?.onlyRundown);

  await axios
    .post(`${ontimeURL}/db?onlyRundown=${onlyRundown}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const complete = progressEvent?.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
        setProgress(complete);
      },
    })
    .then((response) => response.data.id);
};

/**
 * @description Make patch changes to the objects in the db
 * @return {Promise}
 */
export async function patchData(patchDb: Partial<DatabaseModel>): Promise<void> {
  return await axios.patch(`${ontimeURL}/db`, patchDb);
}

type PreviewSpreadsheetResponse = {
  rundown: OntimeRundown;
  customFields: CustomFields;
};

/**
 * @description Make patch changes to the objects in the db
 * @return {Promise} - returns parsed rundown and customFields
 */
export async function importSpreadsheetPreview(file: File, options: ImportMap): Promise<PreviewSpreadsheetResponse> {
  const formData = new FormData();
  formData.append('userFile', file);
  formData.append('options', JSON.stringify(options));

  const response: AxiosResponse<PreviewSpreadsheetResponse> = await axios.post(
    `${ontimeURL}/spreadsheet/preview`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}

export type HasUpdate = {
  url: string;
  version: string;
};

/**
 * @description HTTP request to get the latest version and url from github
 * @return {Promise}
 */
export async function getLatestVersion(): Promise<HasUpdate> {
  const res = await axios.get(`${apiRepoLatest}`);
  return {
    url: res.data.html_url as string,
    version: res.data.tag_name as string,
  };
}

/**
 * @description HTTP request to get the list of available project files
 */
export async function getProjects(): Promise<ProjectFileListResponse> {
  const res = await axios.get(`${ontimeURL}/projects`);
  return res.data;
}

/**
 * @description HTTP request to load a project file
 */
export async function loadProject(filename: string): Promise<MessageResponse> {
  const res = await axios.post(`${ontimeURL}/load-project`, {
    filename,
  });
  return res.data;
}

/**
 * @description HTTP request to initiate the authentication service with google
 */
export const requestConnection = async (
  file: File,
  sheetId: string,
): Promise<{
  verification_url: string;
  user_code: string;
}> => {
  const formData = new FormData();
  formData.append('client_secret', file);

  const response = await axios.post(`${ontimeURL}/sheet/${sheetId}/connect`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * @description HTTP request to verify whether we are authenticated with Google Sheet service
 */
export const verifyAuthenticationStatus = async (): Promise<{ authenticated: AuthenticationStatus }> => {
  const response = await axios.get(`${ontimeURL}/sheet/connect`);
  return response.data;
};

/**
 * @description HTTP request to revoke authentication to google sheet
 */
export const revokeAuthentication = async (): Promise<{ authenticated: AuthenticationStatus }> => {
  const response = await axios.post(`${ontimeURL}/sheet/revoke`);
  return response.data;
};

/**
 * @description HTTP request to upload preview the contents of a google sheet as rundown
 */
export const previewRundown = async (
  sheetId: string,
  options: ImportMap,
): Promise<{
  rundown: OntimeRundown;
  customFields: CustomFields;
}> => {
  const response = await axios.post(`${ontimeURL}/sheet/${sheetId}/read`, { options });
  return response.data;
};

/**
 * @description HTTP request to upload the rundown to a google sheet
 */
export const uploadRundown = async (sheetId: string, options: ImportMap): Promise<void> => {
  const response = await axios.post(`${ontimeURL}/sheet/${sheetId}/write`, { options });
  return response.data;
};

/**
 * @description HTTP request to rename a project file
 */
export async function renameProject(filename: string, newFilename: string): Promise<MessageResponse> {
  const url = `${ontimeURL}/project/${filename}/rename`;
  const decodedUrl = decodeURIComponent(url);
  const res = await axios.put(decodedUrl, {
    newFilename,
  });
  return res.data;
}

/**
 * @description HTTP request to duplicate a project file
 */
export async function duplicateProject(filename: string, newFilename: string): Promise<MessageResponse> {
  const url = `${ontimeURL}/project/${filename}/duplicate`;
  const decodedUrl = decodeURIComponent(url);
  const res = await axios.post(decodedUrl, {
    newFilename,
  });
  return res.data;
}

/**
 * @description HTTP request to delete a project file
 */
export async function deleteProject(filename: string): Promise<MessageResponse> {
  const url = `${ontimeURL}/project/${filename}`;
  const decodedUrl = decodeURIComponent(url);
  const res = await axios.delete(decodedUrl);
  return res.data;
}

/**
 * @description HTTP request to create a project file
 */
export async function createProject(
  project: Partial<
    ProjectData & {
      filename: string;
    }
  >,
): Promise<MessageResponse> {
  // TODO: is this URL correct?
  const url = `${ontimeURL}/project`;
  const decodedUrl = decodeURIComponent(url);
  const res = await axios.post(decodedUrl, project);
  return res.data;
}

/**
 * Requests list of known custom fields
 */
export async function getCustomFields(): Promise<CustomFields> {
  const res = await axios.get(`${projectDataURL}/custom-field`);
  return res.data;
}

/**
 * Sets list of known custom fields
 */
export async function postCustomField(newField: CustomField): Promise<CustomFields> {
  const res = await axios.post(`${projectDataURL}/custom-field`, {
    ...newField,
  });
  return res.data;
}

/**
 * Edits single custom field
 */
export async function editCustomField(label: CustomFieldLabel, newField: CustomField): Promise<CustomFields> {
  const res = await axios.put(`${projectDataURL}/custom-field/${label}`, {
    ...newField,
  });
  return res.data;
}

/**
 * Deletes single custom field
 */
export async function deleteCustomField(label: CustomFieldLabel): Promise<CustomFields> {
  const res = await axios.delete(`${projectDataURL}/custom-field/${label}`);
  return res.data;
}
