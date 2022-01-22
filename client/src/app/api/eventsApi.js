import axios from 'axios';
import { eventsURL } from './apiConstants';

export const fetchAllEvents = async () => {
  const res = await axios.get(eventsURL);
  return res.data;
};

export const requestPost = async (data) => {
  return await axios.post(eventsURL, data);
};

export const requestPut = async (data) => {
  return await axios.put(eventsURL, data);
};

export const requestPatch = async (data) => {
  return await axios.patch(eventsURL, data);
};

export const requestReorder = async (data) => {
  const action = 'reorder';
  return await axios.patch(`${eventsURL}/${action}`, data);
};

export const requestApplyDelay = async (eventId) => {
  const action = 'applydelay';
  return await axios.patch(`${eventsURL}/${action}/${eventId}`);
};

export const requestDelete = async (eventId) => {
  return await axios.delete(`${eventsURL}/${eventId}`);
};

export const requestDeleteAll = async () => {
  return await axios.delete(`${eventsURL}/all`);
};
