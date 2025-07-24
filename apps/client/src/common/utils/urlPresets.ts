import { Path, resolvePath } from 'react-router';
import { OntimeView, OntimeViewPresettable, URLPreset } from 'ontime-types';
import { checkRegex } from 'ontime-utils';

/**
 * Validates a preset against defined parameters
 * Used in the context of form validation
 */
export function validateUrlPresetPath(preset: string): { message: string; isValid: boolean } {
  if (preset === '' || preset == null) {
    return { isValid: false, message: 'Path cannot be empty' };
  }

  if (preset.includes('http') || preset.includes('https') || preset.includes('www')) {
    return { isValid: false, message: 'Path should not include http, https, www' };
  }

  if (preset.includes('127.0.0.1') || preset.includes('localhost') || preset.includes('0.0.0.0')) {
    return { isValid: false, message: 'Path should not include hostname' };
  }

  if (preset.includes('editor')) {
    // no editor
    return { isValid: false, message: 'No path to editor page allowed' };
  }

  return { isValid: true, message: 'ok' };
}

/**
 * Checks whether the current location corresponds to a preset and returns the new path if necessary
 */
export function getRouteFromPreset(location: Path, urlPresets: URLPreset[]): string | null {
  // if we're already on a preset path, no need to redirect
  if (isPresetPath(location)) {
    return null;
  }

  // TODO: maybe we need to get this some other way
  const currentPath = `${location.pathname}${location.search}`.substring(1);
  const isLocked = location.search.includes('locked=true');
  const currentURL = getCurrentPath(location);
  const token = new URLSearchParams(location.search).get('token');

  for (const preset of urlPresets) {
    if (!preset.enabled) continue;
    /**
     * If the page is a known alias it would be like
     * /preset/{alias} <- locked to a preset
     * or
     * /{target}?alias={alias}  <- unwrapped preset options
     *
     * we need to compare the saved preset to the current path to see if we need to redirect
     */
    if (preset.alias === currentURL || preset.target === currentURL) {
      const newPath = generatePathFromPreset(preset.target, preset.search, preset.alias, isLocked, token);
      /**
       * if the current path is equivalent to the new path, we return null
       * this means we will not redirect
       */
      return arePathsEquivalent(currentPath, newPath) ? null : newPath;
    }
  }

  return null;
}

/**
 * Resolves the current path accounting for the base URI
 * Returns the alias if it's a preset path, or the last segment otherwise
 */
export function getCurrentPath(location: Path): string {
  // 1. get path without query parameters
  const pathWithoutQuery = location.pathname.split('?')[0];
  // 2. split path into segments and filter out empty segments
  const segments = pathWithoutQuery.split('/').filter(Boolean);

  // If this is a preset path, return the alias (last segment)
  if (segments[0] === 'preset' && segments.length > 1) {
    return segments[1];
  }

  // Otherwise return the last segment (view name)
  return segments[segments.length - 1] || '';
}

/**
 * Handles generating a path and search parameters from a preset
 * This is done when we want to keep the current navigation and unwrap the search params
 */
export function generatePathFromPreset(
  target: Omit<OntimeView, 'editor'>,
  search: string,
  alias: string,
  locked: boolean,
  token: string | null,
): string {
  const path = resolvePath(`${target}?${search}`);
  const searchParams = new URLSearchParams(path.search);

  // save the alias so we have a reference to it being a preset and can update if necessary
  searchParams.set('alias', alias);

  // maintain params from the URL search feature
  if (locked) {
    searchParams.set('locked', 'true');
  }

  if (token) {
    searchParams.set('token', token);
  }

  // return path concatenated without the leading slash
  return `${path.pathname}?${searchParams}`.substring(1);
}

/**
 * Utility checks if two paths are equivalent
 * For preset paths, only compares the path (since params are stored in session)
 * For regular paths, compares path and search params (ignoring token)
 */
export function arePathsEquivalent(currentPath: string, newPath: string): boolean {
  const currentUrl = new URL(currentPath, document.location.origin);
  const newUrl = new URL(newPath, document.location.origin);

  // For preset paths, only compare the path
  if (currentUrl.pathname.startsWith('/preset/') || newUrl.pathname.startsWith('/preset/')) {
    return currentUrl.pathname === newUrl.pathname;
  }

  // For regular paths, compare path and search params (ignoring token)
  if (currentUrl.pathname !== newUrl.pathname) {
    return false;
  }

  currentUrl.searchParams.delete('token');
  currentUrl.searchParams.delete('locked');
  newUrl.searchParams.delete('token');
  newUrl.searchParams.delete('locked');

  return currentUrl.searchParams.toString() === newUrl.searchParams.toString();
}

/**
 * Generates a URL preset from a user given alias and URL.
 */
export function generateUrlPresetOptions(alias: string, userUrl: string): URLPreset {
  let sanitisedUrl = userUrl;
  // we need to ensure the URL has a protocol, but it doesnt matter which
  if (!checkRegex.startsWithHttp(userUrl.toLowerCase())) {
    sanitisedUrl = `http://${sanitisedUrl}`;
  }

  const url = new URL(sanitisedUrl);
  const path = getCurrentPath(url);

  if (!isPresettableView(path)) {
    throw new Error(`Invalid target view: ${path}`);
  }

  return {
    alias,
    target: path,
    search: url.searchParams.toString(),
    enabled: true,
  };
}

function isPresettableView(view: string): view is OntimeViewPresettable {
  return view !== OntimeView.Editor && Object.values(OntimeView).includes(view as OntimeView);
}

export function makePresetKey(alias: string): string {
  return `preset-${alias}`;
}

/**
 * Check if current location is a preset path
 */
export function isPresetPath(location: Path): boolean {
  const segments = location.pathname.split('/').filter(Boolean);
  return segments[0] === 'preset';
}
