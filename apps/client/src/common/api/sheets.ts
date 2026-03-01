import axios, { AxiosResponse } from 'axios';
import { AuthenticationStatus, CustomFields, Rundown, RundownSummary } from 'ontime-types';
import { ImportMap } from 'ontime-utils';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';
import { axiosConfig } from './requestTimeouts';

const sheetsPath = `${apiEntryUrl}/sheets`;

/**
 * HTTP request to verify whether we are authenticated with Google Sheet service
 */
export const verifyAuthenticationStatus = async (): Promise<{
  authenticated: AuthenticationStatus;
  sheetId: string;
}> => {
  const response = await axios.get(`${sheetsPath}/connect`);
  return response.data;
};

/**
 * HTTP request to initiate the authentication service with google
 */
export const requestConnection = async (
  file: File,
  sheetId: string,
  requestOptions?: RequestOptions,
): Promise<{
  verification_url: string;
  user_code: string;
}> => {
  const formData = new FormData();
  formData.append('client_secret', file);

  const response = await axios.post(`${sheetsPath}/${sheetId}/connect`, formData, {
    signal: requestOptions?.signal,
    timeout: requestOptions?.timeout ?? axiosConfig.longTimeout,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * HTTP request to revoke authentication to google sheet
 */
export const revokeAuthentication = async (): Promise<{ authenticated: AuthenticationStatus }> => {
  const response = await axios.post(`${sheetsPath}/revoke`);
  return response.data;
};

/**
 * HTTP request to upload preview the contents of a google sheet as rundown
 */
export const previewRundown = async (
  sheetId: string,
  options: ImportMap,
  requestOptions?: RequestOptions,
): Promise<{
  rundown: Rundown;
  customFields: CustomFields;
  summary: RundownSummary;
}> => {
  const response = await axios.post(
    `${sheetsPath}/${sheetId}/read`,
    { options },
    {
      signal: requestOptions?.signal,
      timeout: requestOptions?.timeout ?? axiosConfig.longTimeout,
    },
  );
  return response.data;
};

export const getWorksheetNames = async (sheetId: string, requestOptions?: RequestOptions): Promise<string[]> => {
  const response: AxiosResponse<string[]> = await axios.post(`${sheetsPath}/${sheetId}/worksheets`, undefined, {
    signal: requestOptions?.signal,
    timeout: requestOptions?.timeout ?? axiosConfig.longTimeout,
  });
  return response.data;
};

/**
 * HTTP request to upload the rundown to a google sheet
 */
export const uploadRundown = async (
  sheetId: string,
  options: ImportMap,
  requestOptions?: RequestOptions,
): Promise<void> => {
  const response = await axios.post(
    `${sheetsPath}/${sheetId}/write`,
    { options },
    {
      signal: requestOptions?.signal,
      timeout: requestOptions?.timeout ?? axiosConfig.longTimeout,
    },
  );
  return response.data;
};
