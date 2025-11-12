/**
 * This file contains a list of constants that may need to be resolved at runtime
 */

import { readFileSync, writeFileSync } from 'node:fs';

import { srcFiles } from './setup/index.js';
import { isOntimeCloud } from './setup/environment.js';

// =================================================
export const password = process.env.SESSION_PASSWORD;
export const routerPrefix = process.env.ROUTER_PREFIX;

/**
 * Updates the router prefix in the index.html file
 * This is only needed in the cloud environment where the client is not at the root segment
 * ie: https://cloud.getontime.com/client-hash/timer
 */
export function updateRouterPrefix(prefix: string | undefined = routerPrefix): string {
  if (!prefix) {
    return '';
  }

  try {
    const data = readFileSync(srcFiles.clientIndexHtml, { encoding: 'utf-8', flag: 'r' }).replace(
      '<base href="/" />',
      `<base href="/${prefix}/" ${isOntimeCloud ? 'data-is-cloud' : ''}/>`,
    );
    writeFileSync(srcFiles.clientIndexHtml, data, { encoding: 'utf-8', flag: 'w' });
  } catch (_error) {
    /** unhandled */
  }

  return `/${prefix}`;
}
