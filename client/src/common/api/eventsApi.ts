import axios from 'axios';

import { OntimeRundown, OntimeRundownEntry } from '../models/EventTypes';

import { eventsURL } from './apiConstants';

/**
 * @description HTTP request to fetch all events
 * @return {Promise}
 */
export async function fetchRundown(): Promise<OntimeRundown> {
  const res = await axios.get(eventsURL);
  return res.data;
}

/**
 * @description HTTP request to post new event
 * @return {Promise}
 */
export async function requestPostEvent(data: OntimeRundownEntry) {
  return axios.post(eventsURL, data);
}

/**
 * @description HTTP request to put new event
 * @return {Promise}
 */
export async function requestPutEvent(data: OntimeRundownEntry) {
  return axios.put(eventsURL, data);
}

/**
 * @description HTTP request to modify event
 * @return {Promise}
 */
export async function requestPatchEvent(data: OntimeRundownEntry) {
  return axios.patch(eventsURL, data);
}

/**
 * @description HTTP request to reorder events
 * @return {Promise}
 */
export async function requestReorderEvent(data: OntimeRundownEntry) {
  return axios.patch(`${eventsURL}/reorder`, data);
}

/**
 * @description HTTP request to request application of delay
 * @return {Promise}
 */
export async function requestApplyDelay(eventId: string) {
  return axios.patch(`${eventsURL}/applydelay/${eventId}`);
}

/**
 * @description HTTP request to delete given event
 * @return {Promise}
 */
export async function requestDelete(eventId: string) {
  return axios.delete(`${eventsURL}/${eventId}`);
}

/**
 * @description HTTP request to delete all events
 * @return {Promise}
 */
export async function requestDeleteAll() {
  return axios.delete(`${eventsURL}/all`);
}
