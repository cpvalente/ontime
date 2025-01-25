import axios from 'axios';
import { OntimeReport } from 'ontime-types';

import { apiEntryUrl } from './constants';

export const reportUrl = `${apiEntryUrl}/report`;

/**
 * HTTP request to fetch all events
 */
export async function fetchReport(): Promise<OntimeReport> {
  const res = await axios.get(`${reportUrl}/`);
  return res.data;
}
