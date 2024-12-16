import type { MouseEvent } from 'react';

import { baseURI, serverURL } from '../../externals';

/**
 * Open an external URLs: specifically for a electron / browser case
 * If electron: ask main process to call a new browser window
 * If browser: open in new tab
 * @param url
 */
export function openLink(url: string) {
  if (window.process?.type === 'renderer') {
    window.ipcRenderer.send('send-to-link', url);
  } else {
    window.open(url);
  }
}

/**
 * Handles opening external links
 * @param event
 * @param location
 */
export function handleLinks(event: MouseEvent, location: string) {
  // we handle the link manually
  event.preventDefault();

  const destination = new URL(serverURL);
  destination.pathname = baseURI ? `${baseURI}/${location}` : location;
  openLink(destination.toString());
}

export function linkToOtherHost(host: string, path?: string) {
  const destination = new URL(serverURL);
  destination.hostname = host;
  if (path) {
    destination.pathname = baseURI ? `${baseURI}/${path}` : path;
  }
  return destination.toString();
}
