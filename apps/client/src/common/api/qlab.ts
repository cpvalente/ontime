import axios from 'axios';
import type { QlabSettings } from 'ontime-types';

import { apiEntryUrl } from './constants';

const qlabPath = `${apiEntryUrl}/qlab`;

export async function getQlabSettings(): Promise<QlabSettings> {
  const res = await axios.get(qlabPath);
  return res.data;
}

export async function editQlabSettings(settings: QlabSettings): Promise<QlabSettings> {
  const res = await axios.post(qlabPath, settings);
  return res.data;
}
