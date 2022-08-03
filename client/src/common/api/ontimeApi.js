import axios from 'axios';

import { ontimeURL } from './apiConstants';

/**
 * @description placeholder information for ontimeInfo
 * @type {{settings: {serverPort: number, version: string}, networkInterfaces: *[]}}
 */
export const ontimePlaceholderInfo = {
  networkInterfaces: [],
  settings: {
    version: '',
    serverPort: 4001,
  },
};

/**
 * @description placeholder information for ontimeSettings
 * @type {{pinCode: null}}
 */
export const ontimePlaceholderSettings = {
  pinCode: null,
};

/**
 * @description placeholder information for eventSettings
 * @type {{backstageInfo: string, endMessage: string, publicInfo: string, title: string, url: string}}
 */
export const eventPlaceholderSettings = {
  title: '',
  url: '',
  publicInfo: '',
  backstageInfo: '',
  endMessage: '',
};

/**
 * @description placeholder information for userFields
 * @type {{user1: string, user2: string, user0: string, user9: string, user7: string, user8: string, user5: string, user6: string, user3: string, user4: string}}
 */
export const userFieldsPlaceholder = {
  user0: '',
  user1: '',
  user2: '',
  user3: '',
  user4: '',
  user5: '',
  user6: '',
  user7: '',
  user8: '',
  user9: '',
};

/**
 * @description placeholder information for oscSettings
 * @type {{targetIP: string, port: string, portOut: string, enabled: boolean}}
 */
export const oscPlaceholderSettings = {
  port: '',
  portOut: '',
  targetIP: '',
  enabled: false,
};

/**
 * @description placeholder information for httpSettings
 * @type {{onStart: {url: string, enabled: boolean}, onLoad: {url: string, enabled: boolean}, onPause: {url: string, enabled: boolean}, onFinish: {url: string, enabled: boolean}, onUpdate: {url: string, enabled: boolean}, onStop: {url: string, enabled: boolean}}}
 */
export const httpPlaceholder = {
  onLoad: {
    url: '',
    enabled: false,
  },
  onStart: {
    url: '',
    enabled: false,
  },
  onUpdate: {
    url: '',
    enabled: false,
  },
  onPause: {
    url: '',
    enabled: false,
  },
  onStop: {
    url: '',
    enabled: false,
  },
  onFinish: {
    url: '',
    enabled: false,
  },
};

/**
 * @description ontime utility variables
 * @type {[{name: string, description: string}, {name: string, description: string}, {name: string, description: string}, {name: string, description: string}, {name: string, description: string}, null, null]}
 */
export const ontimeVars = [
  {
    name: '$timer',
    description: 'Current running timer',
  },
  {
    name: '$title',
    description: 'Current title',
  },
  {
    name: '$presenter',
    description: 'Current timer',
  },
  {
    name: '$subtitle',
    description: 'Current subtitle',
  },
  {
    name: '$next-title',
    description: 'Next title',
  },
  {
    name: '$next-presenter',
    description: 'Next timer',
  },
  {
    name: '$next-subtitle',
    description: 'Next subtitle',
  },
];

/**
 * @description HTTP request to retrieve application settings
 * @return {Promise}
 */
export const getSettings = async () => {
  const res = await axios.get(`${ontimeURL}/settings`);
  return res.data;
};

/**
 * @description HTTP request to mutate application settings
 * @return {Promise}
 */
export const postSettings = async (data) => axios.post(`${ontimeURL}/settings`, data);

/**
 * @description HTTP request to retrieve application info
 * @return {Promise}
 */
export const getInfo = async () => {
  const res = await axios.get(`${ontimeURL}/info`);
  return res.data;
};

/**
 * @description HTTP request to mutate application info
 * @return {Promise}
 */
export const postInfo = async (data) => axios.post(`${ontimeURL}/info`, data);

/**
 * @description HTTP request to retrieve aliases
 * @return {Promise}
 */
export const getAliases = async () => {
  const res = await axios.get(`${ontimeURL}/aliases`);
  return res.data;
};

/**
 * @description HTTP request to mutate aliases
 * @return {Promise}
 */
export const postAliases = async (data) => axios.post(`${ontimeURL}/aliases`, data);

/**
 * @description HTTP request to retrieve user fields
 * @return {Promise}
 */
export const getUserFields = async () => {
  const res = await axios.get(`${ontimeURL}/userfields`);
  return res.data;
};

/**
 * @description HTTP request to mutate user fields
 * @return {Promise}
 */
export const postUserFields = async (data) => axios.post(`${ontimeURL}/userfields`, data);

/**
 * @description HTTP request to retrieve osc settings
 * @return {Promise}
 */
export const getOSC = async () => {
  const res = await axios.get(`${ontimeURL}/osc`);
  return res.data;
};

/**
 * @description HTTP request to mutate osc settings
 * @return {Promise}
 */
export const postOSC = async (data) => axios.post(`${ontimeURL}/osc`, data);

/**
 * @description HTTP request to download db
 * @return {Promise}
 */
export const downloadEvents = async () => {
  await axios({
    url: `${ontimeURL}/db`,
    method: 'GET',
    responseType: 'blob', // important
  }).then((response) => {
    const headerLine = response.headers['Content-Disposition'];
    let filename = 'events.json';

    // try and get the filename from the response
    if (headerLine != null) {
      const startFileNameIndex = headerLine.indexOf('"') + 1;
      const endFileNameIndex = headerLine.lastIndexOf('"');
      filename = headerLine.substring(startFileNameIndex, endFileNameIndex);
    }

    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: 'application/json' })
    );
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
export const uploadEvents = async (file) => {
  const formData = new FormData();
  formData.append('userFile', file); // appending file
  await axios.post(`${ontimeURL}/db`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * @description HTTP request to upload events
 * @return {Promise}
 */
export const uploadEventsWithPath = async (filepath) => axios.post(`${ontimeURL}/dbpath`, { path: filepath });
