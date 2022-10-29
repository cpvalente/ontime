import axios from 'axios';

import { URLAliasType } from '../models/Alias.type';
import { InfoType } from '../models/Info.types';
import { OntimeSettingsType } from '../models/OntimeSettings.type';
import { OscSettingsType } from '../models/OscSettings.type';
import { UserFieldsType } from '../models/UserFields.type';
import { ViewSettingsType } from '../models/ViewSettings.type';

import { ontimeURL } from './apiConstants';

/**
 * @description HTTP request to retrieve application settings
 * @return {Promise}
 */
export async function getSettings(): Promise<OntimeSettingsType> {
  const res = await axios.get(`${ontimeURL}/settings`);
  return res.data;
}

/**
 * @description HTTP request to mutate application settings
 * @return {Promise}
 */
export async function postSettings(data: OntimeSettingsType) {
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
export async function getView(): Promise<ViewSettingsType> {
  const res = await axios.get(`${ontimeURL}/views`);
  return res.data;
}

/**
 * @description HTTP request to mutate view settings
 * @return {Promise}
 */
export async function postView(data: ViewSettingsType) {
  return axios.post(`${ontimeURL}/views`, data);
}

/**
 * @description HTTP request to retrieve aliases
 * @return {Promise}
 */
export async function getAliases(): Promise<URLAliasType[]> {
  const res = await axios.get(`${ontimeURL}/aliases`);
  return res.data;
}

/**
 * @description HTTP request to mutate aliases
 * @return {Promise}
 */
export async function postAliases(data: URLAliasType[]) {
  return axios.post(`${ontimeURL}/aliases`, data);
}

/**
 * @description HTTP request to retrieve user fields
 * @return {Promise}
 */
export async function getUserFields(): Promise<UserFieldsType> {
  const res = await axios.get(`${ontimeURL}/userfields`);
  return res.data;
}

/**
 * @description HTTP request to mutate user fields
 * @return {Promise}
 */
export async function postUserFields(data: UserFieldsType) {
  return axios.post(`${ontimeURL}/userfields`, data);
}

/**
 * @description HTTP request to retrieve osc settings
 * @return {Promise}
 */
export async function getOSC(): Promise<OscSettingsType> {
  const res = await axios.get(`${ontimeURL}/osc`);
  return res.data;
}

/**
 * @description HTTP request to mutate osc settings
 * @return {Promise}
 */
export async function postOSC(data: OscSettingsType) {
  return axios.post(`${ontimeURL}/osc`, data);
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
}
export const uploadData = async (file: string, setProgress: (value: number) => void, options?: UploadDataOptions) => {
  const formData = new FormData();
  formData.append('userFile', file);
  const onlyRundown = options?.onlyRundown;
  await axios
    .post(`${ontimeURL}/db?onlyRundown=${onlyRundown}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const complete = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(complete);
      },
    })
    .then((response) => response.data.id);
};
