import type { MouseEvent } from 'react';

import { baseURI, serverURL } from '../../externals';

type ElectronWindow = Window & {
  process?: { type?: string };
  ipcRenderer?: {
    send: (channel: string, args?: string | object) => void;
  };
};

/**
 * Open an external URLs: specifically for a electron / browser case
 * If electron: ask main process to call a new browser window
 * If browser: open in new tab
 */
export function openLink(url: string) {
  const electronWindow = window as ElectronWindow;
  if (electronWindow.process?.type === 'renderer' && electronWindow.ipcRenderer) {
    electronWindow.ipcRenderer.send('send-to-link', url);
  } else {
    window.open(url);
  }
}

/**
 * Handles opening external links
 * serverUrl and baseURI are used for testing
 */
export function handleLinks(
  location: string,
  event?: MouseEvent,
  externalServerUrl: string = serverURL,
  externalBaseURI: string = baseURI,
) {
  // we handle the link manually
  event?.preventDefault();

  const destination = new URL(externalServerUrl);
  destination.pathname = externalBaseURI ? `${externalBaseURI}/${location}` : location;
  openLink(destination.toString());
}

export function linkToOtherHost(
  host: string,
  path?: string,
  externalServerUrl: string = serverURL,
  externalBaseURI: string = baseURI,
) {
  const destination = new URL(externalServerUrl);
  destination.hostname = host;
  if (path) {
    destination.pathname = externalBaseURI ? `${externalBaseURI}/${path}` : path;
  }
  return destination.toString();
}

/**
 * Builds a base URL for reaching the Ontime server on a given network interface.
 * The Ontime server itself only speaks HTTP, so we only keep https when the page
 * already reaches the server over TLS on that same port (eg. a proxy in front of it);
 * any other explicit server port gets http.
 * externalServerUrl is used for testing
 */
export function hostToBaseUrl(host: string, port: number, externalServerUrl: string = serverURL): string {
  const page = new URL(externalServerUrl);
  const pagePort = page.port === '' ? (page.protocol === 'https:' ? 443 : 80) : Number(page.port);
  const scheme = page.protocol === 'https:' && pagePort === port ? 'https' : 'http';
  return `${scheme}://${host}:${port}`;
}
