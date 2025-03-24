/**
 * This file contains a list of constants that may need to be resolved at runtime
 */

import { version } from '../../../package.json';

export const githubUrl = 'https://www.github.com/cpvalente/ontime';
export const apiRepoLatest = 'https://api.github.com/repos/cpvalente/ontime/releases/latest';
export const websiteUrl = 'https://www.getontime.no';
export const discordUrl = 'https://discord.com/invite/eje3CSUEXm';

export const documentationUrl = 'https://docs.getontime.no';
export const customFieldsDocsUrl = 'https://docs.getontime.no/features/custom-fields/';

export const githubSponsorUrl = 'https://github.com/sponsors/cpvalente';
export const buyMeACoffeeUrl = 'https://buymeacoffee.com/cpvalente';

// resolve environment
export const appVersion = version;
export const isProduction = import.meta.env.MODE === 'production';
export const isDev = !isProduction;
export const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const isDockerImage = Boolean(import.meta.env.VITE_IS_DOCKER);
export const isOntimeCloud = window.location.hostname.includes('cloud.getontime.no');

// resolve entrypoint URLs

/**
 * Resolve base
 * @example '' for electron
 * @example '/client-hash' for cloud
 */
export const baseURI = resolveBaseURI();
export const serverURL = resolveUrl('http', '');
export const websocketUrl = resolveUrl('ws', 'ws');

function resolveUrl(protocol: 'http' | 'ws', path: string) {
  const url = new URL(window.location.origin);

  // generate ws url
  if (protocol === 'ws') {
    // ensure we remain in a secure context
    const isSecure = window.location.protocol === 'https:';
    url.protocol = isSecure ? 'wss' : 'ws';
  }

  // make path name relative to the base URI
  url.pathname = baseURI ? `${baseURI}/${path}` : path;

  // in development mode, we use the React port for UI, but need the requests to target the server
  if (isDev) {
    // this is used as a fallback port for development
    url.port = '4001';
  }

  const result = url.toString();

  // prevent trailing slash
  return result.endsWith('/') ? result.slice(0, -1) : result;
}

/**
 * Resolves a base URI for a client that is not at the root segment
 * ie: https://cloud.getontime.com/client-hash/timer
 * This is necessary for ontime cloud and should otherwise not affect the client
 */
function resolveBaseURI(): string {
  // in ontime cloud, the base tag is set by the server
  const baseHref = document.querySelector('base')?.getAttribute('href');
  const base = baseHref ?? '';

  // prevent a trailing slash from either an empty base or a base with a trailing slash
  if (base.endsWith('/')) {
    return base.slice(0, -1);
  }

  return base;
}
