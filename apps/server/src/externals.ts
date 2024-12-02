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
export function updateRouterPrefix(prefix: string | undefined = process.env.ROUTER_PREFIX) {
  if (!prefix) {
    return;
  }

  const indexFile = resolve('.', 'client', 'index.html');
  try {
    const data = readFileSync(indexFile, { encoding: 'utf-8', flag: 'r' }).replace(
      /<base href="[^"]*">/g,
      `<base href="${prefix}" />`,
    );
    writeFileSync(indexFile, data, { encoding: 'utf-8', flag: 'w' });
  } catch (_error) {
    /** unhandled */
  }
}
