import axios from 'axios';
import {
  Alias,
  EventData,
  OSCSettings,
  OscSubscription,
  Settings,
  UserFields,
  ViewSettings,
} from 'ontime-types';

import { apiRepoLatest } from '../../externals';
import { InfoType } from '../models/Info';

import { ontimeURL } from './apiConstants';

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
export async function getInfo(): Promise<InfoType> {
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
 * @description HTTP request to retrieve user fields
 * @return {Promise}
 */
export async function getUserFields(): Promise<UserFields> {
  const res = await axios.get(`${ontimeURL}/userfields`);
  return res.data;
}

/**
 * @description HTTP request to mutate user fields
 * @return {Promise}
 */
export async function postUserFields(data: UserFields) {
  return axios.post(`${ontimeURL}/userfields`, data);
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
export async function postOSC(data: OSCSettings) {
  return axios.post(`${ontimeURL}/osc`, data);
}

/**
 * @description HTTP request to mutate osc subscriptions
 * @return {Promise}
 */
export async function postOscSubscriptions(data: OscSubscription) {
  return axios.post(`${ontimeURL}/osc-subscriptions`, data);
}

/**
 * @description HTTP request to download db
 * @return {Promise}
 */
export const downloadRundown = async () => {
  await axios({
    url: `${ontimeURL}/db`,
    method: 'GET',
    responseType: 'blob', // important
  }).then((response) => {
    const headerLine = response.headers['Content-Disposition'];
    let filename = 'rundown.json';

    // try and get the filename from the response
    if (headerLine != null) {
      const startFileNameIndex = headerLine.indexOf('"') + 1;
      const endFileNameIndex = headerLine.lastIndexOf('"');
      filename = headerLine.substring(startFileNameIndex, endFileNameIndex);
    }

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
  });
};

/**
 * @description HTTP request to upload events db
 * @return {Promise}
 */
type UploadDataOptions = {
  onlyRundown?: boolean;
};
export const uploadData = async (file: File, setProgress: (value: number) => void, options?: UploadDataOptions) => {
  const formData = new FormData();
  formData.append('userFile', file);
  const onlyRundown = options?.onlyRundown || 'false';
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

export async function postNew(initialData: Partial<EventData>) {
  return axios.post(`${ontimeURL}/new`, initialData);
}
