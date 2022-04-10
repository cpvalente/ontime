import axios from 'axios';
import { eventsURL } from './apiConstants';

export const fetchAllEvents = async () => {
  const res = await axios.get(eventsURL);
  return res.data;
};

export const requestPost = async (data) => axios.post(eventsURL, data);

export const requestPut = async (data) => axios.put(eventsURL, data);

export const requestPatch = async (data) => axios.patch(eventsURL, data);

export const requestReorder = async (data) => axios.patch(`${eventsURL}/reorder`, data);

export const requestApplyDelay = async (eventId) => axios.patch(`${eventsURL}/applydelay/${eventId}`);

export const requestDelete = async (eventId) => axios.delete(`${eventsURL}/${eventId}`);

export const requestDeleteAll = async () => axios.delete(`${eventsURL}/all`);
