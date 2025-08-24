import axios, { AxiosResponse } from 'axios';
import { EntryId, OntimeEntry, OntimeEvent, ProjectRundownsList, Rundown, TransientEventPayload } from 'ontime-types';

import { apiEntryUrl } from './constants';

const rundownPath = `${apiEntryUrl}/rundowns`;

// #region operations on project rundowns =========================

/**
 * HTTP request to fetch a list of existing rundowns
 */
export async function fetchProjectRundownList(): Promise<ProjectRundownsList> {
  const res = await axios.get(rundownPath);
  return res.data;
}

/**
 * HTTP request to fetch all entries in the currently loaded rundown
 */
export async function fetchCurrentRundown(): Promise<Rundown> {
  const res = await axios.get(`${rundownPath}/current`);
  return res.data;
}

/**
 * HTTP request to switch the currently loaded rundown
 */
export async function loadRundown(id: string): Promise<AxiosResponse<ProjectRundownsList>> {
  return axios.post(`${rundownPath}/${id}/load`);
}

/**
 * HTTP request to create a new rundown
 */
export async function createRundown(title: string): Promise<AxiosResponse<ProjectRundownsList>> {
  return axios.post(rundownPath, { title });
}

/**
 * HTTP request to delete a rundown
 */
export async function deleteRundown(id: string): Promise<AxiosResponse<ProjectRundownsList>> {
  return axios.delete(`${rundownPath}/${id}`);
}

// #endregion operations on project rundowns ======================
// #region operations on rundown entries ==========================

/**
 * HTTP request to post new entry
 */
export async function postAddEntry(
  rundownId: string,
  data: TransientEventPayload,
): Promise<AxiosResponse<OntimeEntry>> {
  return axios.post(`${rundownPath}/${rundownId}/entry`, data);
}

/**
 * HTTP request to edit an entry
 */
export async function putEditEntry(rundownId: string, data: Partial<OntimeEntry>): Promise<AxiosResponse<OntimeEntry>> {
  return axios.put(`${rundownPath}/${rundownId}/entry`, data);
}

export type BatchEditEntry = {
  data: Partial<OntimeEvent>;
  ids: EntryId[];
};

/**
 * HTTP request to edit multiple events
 */
export async function putBatchEditEvents(rundownId: string, data: BatchEditEntry): Promise<AxiosResponse<Rundown>> {
  return axios.put(`${rundownPath}/${rundownId}/batch`, data);
}

export type ReorderEntry = {
  entryId: EntryId;
  destinationId: EntryId;
  order: 'before' | 'after' | 'insert';
};

/**
 * HTTP request to reorder an entry
 */
export async function patchReorderEntry(rundownId: string, data: ReorderEntry): Promise<AxiosResponse<Rundown>> {
  return axios.patch(`${rundownPath}/${rundownId}/reorder`, data);
}

/**
 * HTTP request to swap two events
 */
export async function requestEventSwap(rundownId: string, from: EntryId, to: EntryId): Promise<AxiosResponse<Rundown>> {
  return axios.patch(`${rundownPath}/${rundownId}/swap`, { from, to });
}

/**
 * HTTP request to request application of delay
 */
export async function requestApplyDelay(rundownId: string, delayId: EntryId): Promise<AxiosResponse<Rundown>> {
  return axios.patch(`${rundownPath}/${rundownId}/applydelay/${delayId}`);
}

/**
 * HTTP request for cloning an entry
 */
export async function postCloneEntry(rundownId: string, entryId: EntryId): Promise<AxiosResponse<Rundown>> {
  return axios.post(`${rundownPath}/${rundownId}/clone/${entryId}`);
}

/**
 * HTTP request for grouping a list of entries into a group
 */
export async function requestGroupEntries(rundownId: string, entryIds: EntryId[]): Promise<AxiosResponse<Rundown>> {
  return axios.post(`${rundownPath}/${rundownId}/group`, { ids: entryIds });
}

/**
 * HTTP request for dissolving of a group
 */
export async function requestUngroup(rundownId: string, groupId: EntryId): Promise<AxiosResponse<Rundown>> {
  return axios.post(`${rundownPath}/${rundownId}/ungroup/${groupId}`);
}

/**
 * HTTP request to delete entries of a given rundown
 */
export async function deleteEntries(rundownId: string, entryIds: EntryId[]): Promise<AxiosResponse<Rundown>> {
  return axios.delete(`${rundownPath}/${rundownId}/entries`, { data: { ids: entryIds } });
}

/**
 * HTTP request to delete all entries of a given rundown
 */
export async function requestDeleteAll(rundownId: string): Promise<AxiosResponse<Rundown>> {
  return axios.delete(`${rundownPath}/${rundownId}/all`);
}

// #endregion operations on rundown entries =======================
