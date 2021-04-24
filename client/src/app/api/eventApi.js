import axios from 'axios';
import { NODE_PORT } from './apiConstants';

// get origin from URL
const serverURL = window.location.origin.replace(
  window.location.port,
  `${NODE_PORT}/`
);

export const eventNamespace = 'event';
export const eventURL = serverURL + eventNamespace;

export const fetchEvent = async () => {
  const res = await axios.get(eventURL);
  return res.data;
};

export const postEvent = async (data) => {
  const res = await axios.post(eventURL, data);
  return res;
};
