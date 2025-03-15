import axios, { AxiosResponse } from 'axios';
import {
  MessageResponse,
  OntimeEntry,
  OntimeEvent,
  ProjectRundownsList,
  Rundown,
  TransientEventPayload,
} from 'ontime-types';

import { apiEntryUrl } from './constants';

const rundownPath = `${apiEntryUrl}/rundown`;

/**
 * HTTP request to fetch a list of existing rundowns
 */
export async function fetchProjectRundownList(): Promise<ProjectRundownsList> {
  const res = await axios.get(`${rundownPath}/`);
  return res.data;
}

/**
 * HTTP request to fetch all events
 */
export async function fetchCurrentRundown(): Promise<Rundown> {
  const res = await axios.get(`${rundownPath}/current`);
  return res.data;
}

/**
 * HTTP request to post new event
 */
export async function requestPostEvent(data: TransientEventPayload): Promise<AxiosResponse<OntimeEntry>> {
  return axios.post(rundownPath, data);
}

/**
 * HTTP request to put new event
 */
export async function requestPutEvent(data: Partial<OntimeEntry>): Promise<AxiosResponse<OntimeEntry>> {
  return axios.put(rundownPath, data);
}

type BatchEditEntry = {
  data: Partial<OntimeEvent>;
  ids: string[];
};

/**
 * HTTP request to put multiple events
 */
export async function requestBatchPutEvents(data: BatchEditEntry): Promise<AxiosResponse<MessageResponse>> {
  return axios.put(`${rundownPath}/batch`, data);
}

export type ReorderEntry = {
  eventId: string;
  from: number;
  to: number;
};

/**
 * HTTP request to reorder events
 */
export async function requestReorderEvent(data: ReorderEntry): Promise<AxiosResponse<OntimeEntry>> {
  return axios.patch(`${rundownPath}/reorder`, data);
}

export type SwapEntry = {
  from: string;
  to: string;
};

/**
 * HTTP request to swap two events
 */
export async function requestEventSwap(data: SwapEntry): Promise<AxiosResponse<MessageResponse>> {
  return axios.patch(`${rundownPath}/swap`, data);
}

/**
 * HTTP request to request application of delay
 */
export async function requestApplyDelay(eventId: string): Promise<AxiosResponse<MessageResponse>> {
  return axios.patch(`${rundownPath}/applydelay/${eventId}`);
}

/**
 * HTTP request to delete given event
 */
export async function requestDelete(eventIds: string[]): Promise<AxiosResponse<MessageResponse>> {
  return axios.delete(rundownPath, { data: { ids: eventIds } });
}

/**
 * HTTP request to delete all events
 */
export async function requestDeleteAll(): Promise<AxiosResponse<MessageResponse>> {
  return axios.delete(`${rundownPath}/all`);
}
