import axios from 'axios';

import { apiRepoLatest } from '../../externals';

import type { RequestOptions } from './requestOptions';

export type HasUpdate = {
  url: string;
  version: string;
};

/**
 * HTTP request to get the latest version and url from github
 */
export async function getLatestVersion(options?: RequestOptions): Promise<HasUpdate> {
  const res = await axios.get(apiRepoLatest, { signal: options?.signal });
  return {
    url: res.data.html_url as string,
    version: res.data.tag_name as string,
  };
}
