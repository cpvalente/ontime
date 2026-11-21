/**
 * Access tokens travel in the `token` query param
 * Values we store or share with other clients must not carry them
 */

/** Removes the token param from a query string, with or without its leading ? */
export function removeTokenFromSearch<T>(search: T): T | string {
  if (typeof search !== 'string') {
    return search;
  }
  const params = new URLSearchParams(search);
  if (!params.has('token')) {
    return search;
  }
  params.delete('token');
  const cleaned = params.toString();
  if (!cleaned) {
    return '';
  }
  return search.startsWith('?') ? `?${cleaned}` : cleaned;
}

/** Removes the token param from a path such as /timer?token=abc&n=1 */
export function removeTokenFromPath<T>(path: T): T | string {
  if (typeof path !== 'string') {
    return path;
  }
  const index = path.indexOf('?');
  if (index === -1) {
    return path;
  }
  const search = removeTokenFromSearch(path.slice(index + 1));
  const pathname = path.slice(0, index);
  return search ? `${pathname}?${search}` : pathname;
}
