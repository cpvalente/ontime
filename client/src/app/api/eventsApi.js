import axios from 'axios';
import { eventsURL } from './apiConstants';

export const fetchAllEvents = async () => {
  const res = await axios.get(eventsURL);
  return res.data;
};

export const requestPost = async (data) => {
  await axios.post(eventsURL, data);
};

export const requestPut = async (data) => {
  await axios.put(eventsURL, data);
};

export const requestPatch = async (data) => {
  await axios.patch(eventsURL, data);
};

export const requestReorder = async (data) => {
  await axios.patch(`${eventsURL}/reorder`, data);
};

export const requestApplyDelay = async (eventId) => {
  const action = 'applydelay';
  return await axios.patch(`${eventsURL}/${action}/${eventId}`);
};

export const requestDelete = async (eventId) => {
  await axios.delete(`${eventsURL}/${eventId}`);
};

export const requestDeleteAll = async () => {
  await axios.delete(`${eventsURL}/all`);
};
