import axios from 'axios';

import { apiRepoLatest } from '../../externals';

export type HasUpdate = {
  url: string;
  version: string;
};

/**
 * HTTP request to get the latest version and url from github
 */
export async function getLatestVersion(): Promise<HasUpdate> {
  const res = await axios.get(apiRepoLatest);
  return {
    url: res.data.html_url as string,
    version: res.data.tag_name as string,
  };
}
