import axios, { AxiosResponse } from 'axios';
import {
  EntryId,
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
  const res = await axios.get(rundownPath);
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
 * HTTP request to post new entry
 */
export async function postAddEntry(data: TransientEventPayload): Promise<AxiosResponse<OntimeEntry>> {
  return axios.post(rundownPath, data);
}

/**
 * HTTP request to edit an entry
 */
export async function putEditEntry(data: Partial<OntimeEntry>): Promise<AxiosResponse<OntimeEntry>> {
  return axios.put(rundownPath, data);
}

type BatchEditEntry = {
  data: Partial<OntimeEvent>;
  ids: string[];
};

/**
 * HTTP request to edit multiple events
 */
export async function putBatchEditEvents(data: BatchEditEntry): Promise<AxiosResponse<MessageResponse>> {
  return axios.put(`${rundownPath}/batch`, data);
}

export type ReorderEntry = {
  eventId: string;
  from: number;
  to: number;
};

/**
 * HTTP request to reorder an entry
 */
export async function patchReorderEntry(data: ReorderEntry): Promise<AxiosResponse<Rundown>> {
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
export async function requestApplyDelay(delayId: EntryId): Promise<AxiosResponse<MessageResponse>> {
  return axios.patch(`${rundownPath}/applydelay/${delayId}`);
}

/**
 * HTTP request for cloning an entry
 */
export async function postCloneEntry(entryId: EntryId): Promise<AxiosResponse<Rundown>> {
  return axios.post(`${rundownPath}/clone/${entryId}`);
}

/**
 * HTTP request for dissolving of a block
 */
export async function requestUngroup(blockId: EntryId): Promise<AxiosResponse<Rundown>> {
  return axios.post(`${rundownPath}/ungroup/${blockId}`);
}

/**
 * HTTP request for grouping a list of entries into a block
 */
export async function requestGroupEntries(entryIds: EntryId[]): Promise<AxiosResponse<Rundown>> {
  return axios.post(`${rundownPath}/group`, { ids: entryIds });
}

/**
 * HTTP request to delete entries
 */
export async function deleteEntries(entryIds: EntryId[]): Promise<AxiosResponse<MessageResponse>> {
  return axios.delete(rundownPath, { data: { ids: entryIds } });
}

/**
 * HTTP request to delete all events
 */
export async function requestDeleteAll(): Promise<AxiosResponse<MessageResponse>> {
  return axios.delete(`${rundownPath}/all`);
}
