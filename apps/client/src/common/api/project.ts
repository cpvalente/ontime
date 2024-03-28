import axios, { AxiosResponse } from 'axios';
import { ProjectData } from 'ontime-types';

import { apiEntryUrl } from './constants';

const projectPath = `${apiEntryUrl}/project`;

/**
 * HTTP request to fetch project data
 */
export async function getProjectData(): Promise<ProjectData> {
  const res = await axios.get(projectPath);
  return res.data;
}

/**
 * HTTP request to mutate project data
 */
export async function postProjectData(data: ProjectData): Promise<AxiosResponse<ProjectData>> {
  return axios.post(projectPath, data);
}
