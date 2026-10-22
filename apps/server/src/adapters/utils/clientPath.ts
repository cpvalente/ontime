/**
 * Removes the auth token from a client's reported path
 * Client paths are rebroadcast to every connected client, so they must not carry credentials
 */
export function stripTokenFromPath(path: string): string {
  const queryStart = path.indexOf('?');
  if (queryStart === -1) {
    return path;
  }

  const params = new URLSearchParams(path.slice(queryStart + 1));
  if (!params.has('token')) {
    return path;
  }

  params.delete('token');
  const query = params.toString();
  const pathname = path.slice(0, queryStart);
  return query ? `${pathname}?${query}` : pathname;
}
