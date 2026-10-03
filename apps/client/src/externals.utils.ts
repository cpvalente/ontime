/**
 * Resolves a base URI for a client that is not at the root segment
 * ie: https://cloud.getontime.com/client-hash/timer
 * This is necessary for ontime cloud and should otherwise not affect the client
 * @example '' for electron
 * @example '/client-hash' for cloud
 */
export function resolveBaseURI(baseHref: string | null | undefined): string {
  // in ontime cloud, the base tag is set by the server
  const base = baseHref ?? '';

  // prevent a trailing slash from either an empty base or a base with a trailing slash
  if (base.endsWith('/')) {
    return base.slice(0, -1);
  }

  return base;
}

/**
 * Resolves the URL of a server resource, relative to the base URI
 */
export function resolveUrl(
  location: Pick<Location, 'origin' | 'protocol'>,
  baseURI: string,
  protocol: 'http' | 'ws',
  path: string,
): string {
  const url = new URL(location.origin);

  // generate ws url
  if (protocol === 'ws') {
    // ensure we remain in a secure context
    const isSecure = location.protocol === 'https:';
    url.protocol = isSecure ? 'wss' : 'ws';
  }

  // make path name relative to the base URI
  url.pathname = baseURI ? `${baseURI}/${path}` : path;

  // in development mode, we use the React port for UI, but need the requests to target the server
  // this is done with a proxy in the vite config to avoid CORS issues in the dev environment

  const result = url.toString();

  // prevent trailing slash
  return result.endsWith('/') ? result.slice(0, -1) : result;
}
