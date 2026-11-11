import axios from 'axios';

import { apiRepoLatest, downloadPageUrl } from '../../externals';
import type { RequestOptions } from './requestOptions';

export type HasUpdate = {
  url: string;
  version: string;
};

/**
 * HTTP request to get the latest version from github
 * Updates are always offered through the download page, which picks the right build
 */
export async function getLatestVersion(options?: RequestOptions): Promise<HasUpdate> {
  const res = await axios.get(apiRepoLatest, { signal: options?.signal });
  return {
    url: downloadPageUrl,
    version: res.data.tag_name as string,
  };
}
