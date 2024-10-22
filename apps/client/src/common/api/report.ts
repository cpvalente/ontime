import axios from 'axios';
import { OntimeReport } from 'ontime-types';

import { apiEntryUrl } from './constants';

const reportPath = `${apiEntryUrl}/report`;

/**
 * HTTP request to fetch all events
 */
export async function fetchReport(): Promise<OntimeReport> {
  const res = await axios.get(`${reportPath}`);
  return res.data;
}
