import axios from 'axios';
import { ProjectData } from 'ontime-types';

import { projectDataURL } from './apiConstants';

/**
 * @description HTTP request to fetch project data
 * @return {Promise}
 */
export async function getProjectData(): Promise<ProjectData> {
  const res = await axios.get(projectDataURL);
  return res.data;
}

/**
 * @description HTTP request to mutate project data
 * @return {Promise}
 */
export async function postProjectData(data: ProjectData) {
  return axios.post(projectDataURL, data);
}
