/**
 * This file contains a list of constants that may need to be resolved at runtime
 */

export const githubUrl = 'https://www.github.com/cpvalente/ontime';
export const apiRepoLatest = 'https://api.github.com/repos/cpvalente/ontime/releases/latest';
export const websiteUrl = 'https://www.getontime.no';

export const documentationUrl = 'https://docs.getontime.no';
export const customFieldsDocsUrl = 'https://docs.getontime.no/features/custom-fields/';

// resolve environment
export const isProduction = import.meta.env.MODE === 'production';
export const isDev = !isProduction;
export const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const isOntimeCloud = Boolean(import.meta.env.VITE_IS_CLOUD);

// resolve protocol
const socketProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

// resolve port
const STATIC_PORT = 4001;
export const serverPort = isProduction ? window.location.port : STATIC_PORT;
export const serverURL = `${window.location.protocol}//${location.hostname}:${serverPort}`;
export const websocketUrl = `${socketProtocol}://${location.hostname}:${serverPort}/ws`;
