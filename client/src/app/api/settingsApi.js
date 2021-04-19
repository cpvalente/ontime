import axios from 'axios';
import { serverURL } from './apiConstants';
export const settingsNamespace = 'settings';
export const settingsURL = serverURL + settingsNamespace;

export const fetchSettings = async () => {
  const res = await axios.get(settingsURL);
  return res.data;
};

export const postSettings = async (data) => {
  console.log('debug sending', data)
  console.log('debug await', await axios.post(settingsURL, data))
  const res = await axios.post(settingsURL, data);
  return res;
};
