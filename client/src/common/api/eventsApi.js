import axios from 'axios';

import { eventsURL } from './apiConstants';

/**
 * @description HTTP request to fetch all events
 * @return {Promise}
 */
export const fetchAllEvents = async () => {
  const res = await axios.get(eventsURL);
  return res.data;
};

/**
 * @description HTTP request to post new event
 * @return {Promise}
 */
export const requestPost = async (data) => axios.post(eventsURL, data);

/**
 * @description HTTP request to put new event
 * @return {Promise}
 */
export const requestPut = async (data) => axios.put(eventsURL, data);

/**
 * @description HTTP request to modify event
 * @return {Promise}
 */
export const requestPatch = async (data) => axios.patch(eventsURL, data);

/**
 * @description HTTP request to reorder events
 * @return {Promise}
 */
export const requestReorder = async (data) => axios.patch(`${eventsURL}/reorder`, data);

/**
 * @description HTTP request to request application of delay
 * @return {Promise}
 */
export const requestApplyDelay = async (eventId) => axios.patch(`${eventsURL}/applydelay/${eventId}`);

/**
 * @description HTTP request to delete given event
 * @return {Promise}
 */
export const requestDelete = async (eventId) => axios.delete(`${eventsURL}/${eventId}`);

/**
 * @description HTTP request to delete all events
 * @return {Promise}
 */
export const requestDeleteAll = async () => axios.delete(`${eventsURL}/all`);
