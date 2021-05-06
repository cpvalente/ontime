import axios from 'axios';
import { NODE_PORT } from '../api/apiConstants';

// get origin from URL
const serverURL = window.location.origin.replace(
  window.location.port,
  `${NODE_PORT}/`
);

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

export const requestReorder = async (data) => {
  const action = 'reorder';
  const res = await axios.patch(eventsURL + '/' + action, data);
  return res;
};

export const requestApplyDelay = async (eventId) => {
  const action = 'applydelay';
  const res = await axios.patch(eventsURL + '/' + action + '/' + eventId);
  return res;
};

export const requestDelete = async (eventId) => {
  const res = await axios.delete(eventsURL + '/' + eventId);
  return res;
};
