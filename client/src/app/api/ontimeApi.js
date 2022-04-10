import axios from 'axios';
import { ontimeURL } from './apiConstants';

export const ontimePlaceholderInfo = {
  networkInterfaces: [],
  settings: {
    version: '',
    serverPort: 4001,
  },
};

export const ontimePlaceholderSettings = {
  pinCode: null,
};

export const eventPlaceholderSettings = {
  title: '',
  url: '',
  publicInfo: '',
  backstageInfo: '',
  endMessage: '',
};

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

export const oscPlaceholderSettings = {
  port: '',
  portOut: '',
  targetIP: '',
  enabled: false,
};

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

export const getSettings = async () => {
  const res = await axios.get(`${ontimeURL}/settings`);
  return res.data;
};

export const postSettings = async (data) => axios.post(`${ontimeURL}/settings`, data);

export const getInfo = async () => {
  const res = await axios.get(`${ontimeURL}/info`);
  return res.data;
};

export const postInfo = async (data) => axios.post(`${ontimeURL}/info`, data);

export const getAliases = async () => {
  const res = await axios.get(`${ontimeURL}/aliases`);
  return res.data;
};

export const postAliases = async (data) => axios.post(`${ontimeURL}/aliases`, data);

export const getUserFields = async () => {
  const res = await axios.get(`${ontimeURL}/userfields`);
  return res.data;
};

export const postUserFields = async (data) => axios.post(`${ontimeURL}/userfields`, data);

export const getOSC = async () => {
  const res = await axios.get(`${ontimeURL}/osc`);
  return res.data;
};

export const postOSC = async (data) => axios.post(`${ontimeURL}/osc`, data);

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

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
  });
};

export const uploadEvents = async (file) => {
  const formData = new FormData();
  formData.append('userFile', file); // appending file
  await axios.post(`${ontimeURL}/db`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const uploadEventsWithPath = async (filepath) => axios.post(`${ontimeURL}/dbpath`, { path: filepath });
