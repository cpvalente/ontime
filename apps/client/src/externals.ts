import { version } from '../../../package.json';
/**
 * This file contains a list of constants that may need to be resolved at runtime
 */

export const githubUrl = 'https://www.github.com/cpvalente/ontime';
export const apiRepoLatest = 'https://api.github.com/repos/cpvalente/ontime/releases/latest';
export const websiteUrl = 'https://www.getontime.no';
export const discordUrl = 'https://discord.com/invite/eje3CSUEXm';

export const documentationUrl = 'https://docs.getontime.no';
export const customFieldsDocsUrl = 'https://docs.getontime.no/features/custom-fields/';

// resolve environment
export const appVersion = version;
export const isProduction = import.meta.env.MODE === 'production';
export const isDev = !isProduction;
export const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const isOntimeCloud = Boolean(import.meta.env.VITE_IS_CLOUD);

// resolve protocol
const socketProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

// resolve port
const STATIC_PORT = 4001; // this is used as a fallback port for development
export const serverPort = isProduction ? window.location.port : STATIC_PORT;
export const baseURI = resolveBaseURI();
export const serverURL = `${window.location.protocol}//${window.location.hostname}:${serverPort}${baseURI}`;
export const websocketUrl = `${socketProtocol}://${window.location.hostname}:${serverPort}${baseURI}/ws`;

/**
 * Resolves a base URI for a client that is not at the root segment
 * ie: https://cloud.getontime.com/client-hash/timer
 * This is necessary for ontime cloud and should otherwise not affect the client
 */
function resolveBaseURI() {
  if (!isOntimeCloud) {
    return '';
  }
  const [_, base, location] = window.location.pathname.split('/');
  if (!location) {
    return '';
  }

  return `/${base}`;
}
