/**
 * This file contains a list of constants that may need to be resolved at runtime
 */

import { readFileSync, writeFileSync } from 'node:fs';

import { srcFiles } from './setup/index.js';

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

  try {
    const data = readFileSync(srcFiles.clientIndexHtml, { encoding: 'utf-8', flag: 'r' }).replace(
      '<base href="/" />',
      `<base href="/${prefix}/" />`,
    );
    writeFileSync(srcFiles.clientIndexHtml, data, { encoding: 'utf-8', flag: 'w' });
  } catch (_error) {
    /** unhandled */
  }

  return `/${prefix}`;
}
