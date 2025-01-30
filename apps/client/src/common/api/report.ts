import axios from 'axios';
import { OntimeReport } from 'ontime-types';

import { ontimeQueryClient } from '../../common/queryClient';

import { apiEntryUrl, REPORT } from './constants';

export const reportUrl = `${apiEntryUrl}/report`;

/**
 * HTTP request to fetch all events
 */
export async function fetchReport(): Promise<OntimeReport> {
  const res = await axios.get(`${reportUrl}/`);
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
