import axios from 'axios';
import { OntimeReport, ShowRun, ShowRunSummary } from 'ontime-types';

import { ontimeQueryClient } from '../../common/queryClient';
import { REPORT, apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';

export const reportUrl = `${apiEntryUrl}/report`;

/**
 * HTTP request to fetch all reports
 */
export async function fetchReport(options?: RequestOptions): Promise<OntimeReport> {
  const res = await axios.get(reportUrl, { signal: options?.signal });
  return res.data;
}

export async function deleteReport(id: string) {
  await axios.delete(`${reportUrl}/${id}`);
  await ontimeQueryClient.invalidateQueries({ queryKey: REPORT });
}

export async function deleteAllReport() {
  await axios.delete(`${reportUrl}/all`);
  await ontimeQueryClient.invalidateQueries({ queryKey: REPORT });
}

/**
 * HTTP request to fetch the run history, optionally scoped to a rundown
 */
export async function fetchRuns(rundownId?: string, options?: RequestOptions): Promise<ShowRunSummary[]> {
  const res = await axios.get(`${reportUrl}/runs`, {
    signal: options?.signal,
    params: rundownId ? { rundownId } : undefined,
  });
  return res.data;
}

/**
 * HTTP request to fetch a single run, including its per event data
 */
export async function fetchRun(id: string, options?: RequestOptions): Promise<ShowRun> {
  const res = await axios.get(`${reportUrl}/runs/${id}`, { signal: options?.signal });
  return res.data;
}

/**
 * HTTP request to fetch the most recently closed run, optionally scoped to a rundown
 * @returns null if there is no closed run yet
 */
export async function fetchLatestRun(rundownId?: string, options?: RequestOptions): Promise<ShowRun | null> {
  try {
    const res = await axios.get(`${reportUrl}/runs/latest`, {
      signal: options?.signal,
      params: rundownId ? { rundownId } : undefined,
    });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function renameRun(id: string, label: string): Promise<ShowRun> {
  const res = await axios.patch(`${reportUrl}/runs/${id}`, { label });
  await ontimeQueryClient.invalidateQueries({ queryKey: REPORT });
  return res.data;
}

export async function deleteRun(id: string) {
  await axios.delete(`${reportUrl}/runs/${id}`);
  await ontimeQueryClient.invalidateQueries({ queryKey: REPORT });
}
