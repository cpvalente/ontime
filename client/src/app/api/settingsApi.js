import axios from 'axios';
import { NODE_PORT } from '../api/apiConstants';

// get origin from URL
const serverURL = window.location.origin.replace(
  window.location.port,
  `${NODE_PORT}/`
);

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
