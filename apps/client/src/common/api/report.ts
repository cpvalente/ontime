import axios from 'axios';
import type { ReportData } from 'ontime-types';

import { ontimeQueryClient } from '../../common/queryClient';
import { REPORT, apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';

export const reportUrl = `${apiEntryUrl}/report`;

/**
 * HTTP request to fetch the report
 */
export async function fetchReport(options?: RequestOptions): Promise<ReportData> {
  const res = await axios.get(reportUrl, { signal: options?.signal });
  return res.data;
}

export async function deleteAllReport() {
  await axios.delete(`${reportUrl}/all`);
  await ontimeQueryClient.invalidateQueries({ queryKey: REPORT });
}
