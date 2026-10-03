/**
 * This file contains a list of constants that may need to be resolved at runtime
 */

import { version } from '../../../package.json';
import { resolveBaseURI, resolveUrl } from './externals.utils';

export const githubUrl = 'https://www.github.com/cpvalente/ontime';
export const apiRepoLatest = 'https://api.github.com/repos/cpvalente/ontime/releases/latest';
export const websiteUrl = 'https://www.getontime.no';
export const discordUrl = 'https://discord.com/invite/eje3CSUEXm';
export const subredditUrl = 'https://www.reddit.com/r/ontimeapp/';
export const youtubeUrl = 'https://www.youtube.com/@ontimeapp';

export const documentationUrl = 'https://docs.getontime.no';
export const customFieldsDocsUrl = 'https://docs.getontime.no/features/custom-fields/';

export const githubSponsorUrl = 'https://github.com/sponsors/cpvalente';
export const buyMeACoffeeUrl = 'https://buymeacoffee.com/cpvalente';

// resolve environment
export const appVersion = version;
export const isDocker = import.meta.env.IS_DOCKER; // this env is made available by the vite.config.js define function
export const isProduction = import.meta.env.PROD;
export const isDev = import.meta.env.DEV;
export const currentHostName = window.location.hostname;
export const isLocalhost = currentHostName === 'localhost' || currentHostName === '127.0.0.1';
export const isOntimeCloud = document.querySelector('base')?.hasAttribute('data-is-cloud');

export const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
export const supportsFullscreen = document.fullscreenEnabled;

// resolve entrypoint URLs
export const baseURI = resolveBaseURI(document.querySelector('base')?.getAttribute('href'));
export const serverURL = resolveUrl(window.location, baseURI, 'http', '');
export const websocketUrl = resolveUrl(window.location, baseURI, 'ws', 'ws');

/**
 * Resolves a session scope for the session
 */
export const sessionScope = resolveSessionScope();
export const getIsNavigationLocked = () => new URLSearchParams(window.location.search).get('n') === '1';

/**
 * The session scope is read from the cookie and will only exist if the app is password protected
 */
function resolveSessionScope() {
  const tokenCookie = document.cookie.split('; ').find((cookie) => cookie.startsWith('token='));

  if (tokenCookie) {
    try {
      const { scope } = JSON.parse(tokenCookie.split('=')[1]);
      return scope;
    } catch {
      return 'rw';
    }
  }
  return 'rw';
}
