/**
 * This file contains a list of constants that may need to be resolved at runtime
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =================================================
// resolve running environment
const env = process.env.NODE_ENV || 'production';

export const isTest = Boolean(process.env.IS_TEST);
export const environment = isTest ? 'test' : env;
export const isDocker = env === 'docker';
export const isProduction = isDocker || (env === 'production' && !isTest);

/**
 * Updates the router prefix in the index.html file
 * This is only needed in the cloud environment where the client is not at the root segment
 * ie: https://cloud.getontime.com/client-hash/timer
 */
export function updateRouterPrefix(prefix: string | undefined = process.env.ROUTER_PREFIX): string {
  if (!prefix) {
    return '';
  }

  const indexFile = resolve('.', 'client', 'index.html');
  try {
    let data = readFileSync(indexFile, { encoding: 'utf-8', flag: 'r' });

    /**
     * Append all relative refs to resources in the index.html file with the new prefix
     */
    data = data.replace('base href="/"', `base href="/${prefix}"`);

    data = data.replace('href="/favicon.ico"', `href='/${prefix}/favicon.ico'`);
    data = data.replace(
      'rel="apple-touch-icon" href="/ontime-logo.png"',
      `rel='apple-touch-icon' href='/${prefix}/ontime-logo.png'`,
    );

    data = data.replace('rel="manifest" href="/site.webmanifest"', `rel='manifest' href='/${prefix}/site.webmanifest'`);
    data = data.replace('rel="manifest" href="/manifest.json"', `rel='manifest' href='/${prefix}/manifest.json'`);

    data = data.replace('type="module" crossorigin src="/assets/', `type="module" crossorigin src="/${prefix}/assets/`);
    data = data.replace(
      'rel="modulepreload" crossorigin href="/assets/',
      `rel="modulepreload" crossorigin href="/${prefix}/assets/`,
    );
    data = data.replace(
      'rel="stylesheet" crossorigin href="/assets/',
      `rel="stylesheet" crossorigin href="/${prefix}/assets/`,
    );
    writeFileSync(indexFile, data, { encoding: 'utf-8', flag: 'w' });
  } catch (_error) {
    /** unhandled */
  }
  return `/${prefix}`;
}
