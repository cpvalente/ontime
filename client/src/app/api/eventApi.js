import axios from 'axios';
import { serverURL } from './apiConstants';

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
