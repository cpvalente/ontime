import axios from 'axios';
import { serverURL } from './apiConstants';
export const eventsNamespace = 'events';
export const eventsURL = serverURL + eventsNamespace;

export const fetchAllEvents = async () => {
  const res = await axios.get(eventsURL);
  return res.data;
};

export const requestPost = async (data) => {
  const res = await axios.post(eventsURL, data);
  return res;
};

export const requestPut = async (data) => {
  const res = await axios.put(eventsURL, data);
  return res;
};

export const requestPatch = async (data) => {
  const res = await axios.patch(eventsURL, data);
  return res;
};

export const requestDelete = async (eventId) => {
  const res = await axios.delete(eventsURL + '/' + eventId);
  return res;
};
