import { generateFullPath } from './aliases';

/**
 * Returns hostname
 * @type {string}
 */
export const host = window?.location?.host;

/**
 * Open an external URLs: specifically for a electron / browser case
 * If electron: ask main process to call a new browser window
 * If browser: open in new tab
 * @param url
 */
export function openLink(url) {
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
 * @param alias (this is optional)
 */
export function handleLinks(event, location, alias = '') {
  const fullPath = generateFullPath(location, alias);
  // we handle the link manually
  event.preventDefault();
  openLink(`http://${host}${fullPath}`);
}
