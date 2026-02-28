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
