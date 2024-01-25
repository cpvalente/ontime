import axios from 'axios';
import { GetRundownCached, OntimeRundown, OntimeRundownEntry } from 'ontime-types';

import { rundownURL } from './apiConstants';

/**
 * @deprecated
 * @description HTTP request to fetch all events
 * @return {Promise}
 */
export async function fetchCachedRundown(): Promise<GetRundownCached> {
  const res = await axios.get(`${rundownURL}/cached`);
  return res.data;
}

/**
 * @deprecated use fetchCachedRundown instead
 * @description HTTP request to fetch all events
 * @return {Promise}
 */
export async function fetchRundown(): Promise<OntimeRundown> {
  const res = await axios.get(rundownURL);
  return res.data;
}

/**
 * @deprecated
 * @description HTTP request to post new event
 * @return {Promise}
 */
export async function requestPostEvent(data: OntimeRundownEntry) {
  return axios.post(rundownURL, data);
}

/**
 * @deprecated
 * @description HTTP request to put new event
 * @return {Promise}
 */
export async function requestPutEvent(data: Partial<OntimeRundownEntry>) {
  return axios.put(rundownURL, data);
}

type BatchEditEntry = {
  data: Partial<OntimeRundownEntry>;
  ids: string[];
};

/**
 * @deprecated
 * @description HTTP request to put multiple events
 * @returns {Promise}
 */
export async function requestBatchPutEvents(data: BatchEditEntry) {
  return axios.put(`${rundownURL}/batchEdit`, data);
}

/**
 * @deprecated
 */
export type ReorderEntry = {
  eventId: string;
  from: number;
  to: number;
};

/**
 * @deprecated
 * @description HTTP request to reorder events
 * @return {Promise}
 */
export async function requestReorderEvent(data: ReorderEntry) {
  return axios.patch(`${rundownURL}/reorder`, data);
}

/**
 * @deprecated
 * @description HTTP request to request application of delay
 * @return {Promise}
 */
export async function requestApplyDelay(eventId: string) {
  return axios.patch(`${rundownURL}/applydelay/${eventId}`);
}
/**
 * @deprecated
 */
export type SwapEntry = {
  from: string;
  to: string;
};

/**
 * @deprecated
 * @description HTTP request to swap two events
 * @return {Promise}
 */
export async function requestEventSwap(data: SwapEntry) {
  return axios.patch(`${rundownURL}/swap`, data);
}

/**
 * @deprecated
 * @description HTTP request to delete given event
 * @return {Promise}
 */
export async function requestDelete(eventId: string) {
  return axios.delete(`${rundownURL}/${eventId}`);
}

/**
 * @deprecated
 * @description HTTP request to delete all events
 * @return {Promise}
 */
export async function requestDeleteAll() {
  return axios.delete(`${rundownURL}/all`);
}
