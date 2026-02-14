import axios, { AxiosResponse } from 'axios';
import { ProjectData, ProjectLogoResponse } from 'ontime-types';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';
import { axiosConfig } from './requestTimeouts';

const projectPath = `${apiEntryUrl}/project`;

/**
 * HTTP request to fetch project data
 */
export async function getProjectData(options?: RequestOptions): Promise<ProjectData> {
  const res = await axios.get(projectPath, {
    signal: options?.signal,
    timeout: options?.timeout,
  });
  return res.data;
}

/**
 * HTTP request to mutate project data
 */
export async function postProjectData(data: ProjectData): Promise<AxiosResponse<ProjectData>> {
  return axios.post(projectPath, data);
}

/**
 * HTTP request to upload a project logo
 */
export async function uploadProjectLogo(file: File): Promise<AxiosResponse<ProjectLogoResponse>> {
  const formData = new FormData();
  formData.append('image', file);
  const response = await axios.post(`${projectPath}/upload`, formData, {
    timeout: axiosConfig.longTimeout,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
}
