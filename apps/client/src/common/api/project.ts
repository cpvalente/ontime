import axios, { AxiosResponse } from 'axios';
import { ProjectData, ProjectImageResponse } from 'ontime-types';

import { apiEntryUrl } from './constants';

export const projectPath = `${apiEntryUrl}/project`;

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

/**
 * HTTP request to upload a project image
 */
export async function uploadProjectImage(file: File): Promise<AxiosResponse<ProjectImageResponse>> {
  const formData = new FormData();
  formData.append('image', file);
  const response = await axios.post(`${projectPath}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
}
