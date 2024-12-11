import axios from 'axios';
import { OntimeReport } from 'ontime-types';

import { apiEntryUrl } from './constants';

const reportPath = `${apiEntryUrl}/report`;

/**
 * HTTP request to fetch all report events
 */
export async function fetchReport(): Promise<OntimeReport> {
  const res = await axios.get(`${reportPath}`);
  return res.data;
}

/**
 * HTTP request to clear report
 */
export async function clearReport(id?: string): Promise<OntimeReport> {
  const res = await axios.delete(`${reportPath}/${id ?? ''}`);
  return res.data;
}
