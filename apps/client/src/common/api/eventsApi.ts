import axios from 'axios';
import { OntimeRundown, OntimeRundownEntry } from 'ontime-types';

import { rundownURL } from './apiConstants';

/**
 * @description HTTP request to fetch all events
 * @return {Promise}
 */
export async function fetchRundown(): Promise<OntimeRundown> {
  const res = await axios.get(rundownURL);
  return res.data;
}

/**
 * @description HTTP request to post new event
 * @return {Promise}
 */
export async function requestPostEvent(data: OntimeRundownEntry) {
  return axios.post(rundownURL, data);
}

/**
 * @description HTTP request to put new event
 * @return {Promise}
 */
export async function requestPutEvent(data: Partial<OntimeRundownEntry>) {
  return axios.put(rundownURL, data);
}

/**
 * @description HTTP request to modify event
 * @return {Promise}
 */
export async function requestPatchEvent(data: OntimeRundownEntry) {
  return axios.patch(rundownURL, data);
}

export type ReorderEntry = {
  eventId: string;
  from: number;
  to: number;
};

/**
 * @description HTTP request to reorder events
 * @return {Promise}
 */
export async function requestReorderEvent(data: ReorderEntry) {
  return axios.patch(`${rundownURL}/reorder`, data);
}

/**
 * @description HTTP request to request application of delay
 * @return {Promise}
 */
export async function requestApplyDelay(eventId: string) {
  return axios.patch(`${rundownURL}/applydelay/${eventId}`);
}

/**
 * @description HTTP request to delete given event
 * @return {Promise}
 */
export async function requestDelete(eventId: string) {
  return axios.delete(`${rundownURL}/${eventId}`);
}

/**
 * @description HTTP request to delete all events
 * @return {Promise}
 */
export async function requestDeleteAll() {
  return axios.delete(`${rundownURL}/all`);
}
