import axios from 'axios';

import { OntimeEventEntry } from '../models/EventTypes';

import { eventsURL } from './apiConstants';

/**
 * @description HTTP request to fetch all events
 * @return {Promise}
 */
export async function fetchAllEvents(): Promise<OntimeEventEntry[]> {
  const res = await axios.get(eventsURL);
  return res.data;
}

/**
 * @description HTTP request to post new event
 * @return {Promise}
 */
export async function requestPostEvent(data: OntimeEventEntry) {
  return axios.post(eventsURL, data);
}

/**
 * @description HTTP request to put new event
 * @return {Promise}
 */
export async function requestPutEvent(data: OntimeEventEntry) {
  return axios.put(eventsURL, data);
}

/**
 * @description HTTP request to modify event
 * @return {Promise}
 */
export async function requestPatchEvent(data: OntimeEventEntry) {
  return axios.patch(eventsURL, data);
}

/**
 * @description HTTP request to reorder events
 * @return {Promise}
 */
export async function requestReorderEvent(data: OntimeEventEntry) {
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
