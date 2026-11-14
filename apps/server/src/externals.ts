/**
 * This file contains a list of constants that may need to be resolved at runtime
 */

import { readFileSync, writeFileSync } from 'node:fs';

import { dashboardUrl, isOntimeCloud } from './setup/environment.js';
import { srcFiles } from './setup/index.js';

// =================================================
export const password = process.env.SESSION_PASSWORD;
export const readPassword = process.env.SESSION_READ_PASSWORD;
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
    const cloudAttributes = isOntimeCloud ? getCloudAttributes(dashboardUrl) : '';
    // a replacer function keeps $ patterns in the dashboard URL from being expanded
    const data = readFileSync(srcFiles.clientIndexHtml, { encoding: 'utf-8', flag: 'r' }).replace(
      '<base href="/" />',
      () => `<base href="/${prefix}/" ${cloudAttributes}/>`,
    );
    writeFileSync(srcFiles.clientIndexHtml, data, { encoding: 'utf-8', flag: 'w' });
  } catch (_error) {
    /** unhandled */
  }

  return `/${prefix}`;
}

/**
 * Builds the attributes that mark the client as running in Ontime Cloud
 * The dashboard URL is only kept if it is an https URL, and is escaped for an HTML attribute
 */
export function getCloudAttributes(dashboardUrl: string | undefined): string {
  const url = parseHttpsUrl(dashboardUrl?.trim());
  return url ? `data-is-cloud data-dashboard-url="${escapeHtml(url)}"` : 'data-is-cloud';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function parseHttpsUrl(value: string | undefined): string | undefined {
  if (!value || !URL.canParse(value)) return undefined;
  const url = new URL(value);
  return url.protocol === 'https:' ? url.href : undefined;
}
