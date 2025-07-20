import { Path, resolvePath } from 'react-router-dom';
import { OntimeView, URLPreset } from 'ontime-types';
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
 * Utility removes trailing slash from a string
 */
function removeTrailingSlash(text: string): string {
  return text.replace(/\/$/, '');
}

/**
 * Checks whether the current location corresponds to a preset and returns the new path if necessary
 */
export function getRouteFromPreset(location: Path, urlPresets: URLPreset[]): string | null {
  // current url is the pathname without the leading slash
  const currentURL = location.pathname.substring(1);
  const searchParams = new URLSearchParams(location.search);

  // check if we have token or locked in the search params
  const locked = searchParams.get('locked');
  const token = searchParams.get('token');

  // we need to check if the whole url is an alias
  const foundPreset = urlPresets.find((preset) => preset.alias === removeTrailingSlash(currentURL) && preset.enabled);
  if (foundPreset) {
    // if so, we can redirect to the preset path
    return generatePathFromPreset(foundPreset.target, foundPreset.search, foundPreset.alias, locked, token);
  }

  // if the current url is not an alias, we check if the alias is in the search parameters
  const presetOnPage = searchParams.get('alias');
  if (!presetOnPage) {
    return null;
  }

  const currentPath = `${location.pathname}${location.search}`.substring(1);

  for (const preset of urlPresets) {
    // if the page has a known enabled alias, we check if we need to redirect
    if (preset.alias === presetOnPage && preset.enabled) {
      const newPath = generatePathFromPreset(preset.target, preset.search, preset.alias, locked, token);
      if (!arePathsEquivalent(currentPath, newPath)) {
        // if current path is out of date
        // return new path so we can redirect
        return newPath;
      }
    }
  }
  return null;
}

/**
 * Handles generating a path and search parameters from a preset
 */
export function generatePathFromPreset(
  target: Omit<OntimeView, 'editor'>,
  search: string,
  alias: string,
  locked: string | null,
  token: string | null,
): string {
  const path = resolvePath(`${target}?${search}`);
  const searchParams = new URLSearchParams(path.search);

  // save the alias so we have a reference to it being a preset and can update if necessary
  searchParams.set('alias', alias);

  // maintain params from the URL search feature
  if (locked) {
    searchParams.set('locked', locked);
  }

  if (token) {
    searchParams.set('token', token);
  }

  // return path concatenated without the leading slash
  return `${path.pathname}?${searchParams}`.substring(1);
}

/**
 * Utility checks if two paths are equivalent
 * Considers the edge cases for url sharing where a path may contain extra arguments from the alias
 * - token
 * - locked
 */
export function arePathsEquivalent(currentPath: string, newPath: string): boolean {
  const currentUrl = new URL(currentPath, document.location.origin);
  const newUrl = new URL(newPath, document.location.origin);

  // check path
  if (currentUrl.pathname !== newUrl.pathname) {
    return false;
  }

  // check search params
  // if the params match, we dont need further checks
  if (currentUrl.searchParams.toString() === newUrl.searchParams.toString()) {
    return true;
  }

  // if there is no match, we check the edge cases for the url sharing feature
  currentUrl.searchParams.delete('token');
  currentUrl.searchParams.delete('locked');

  return currentUrl.searchParams.toString() === newUrl.searchParams.toString();
}

/**
 * Generates a URL preset from a user given alias and URL.
 */
export function generateUrlPresetOptions(alias: string, userUrl: string): URLPreset {
  let sanitisedUrl = userUrl.toLowerCase();
  // we need to ensure the URL has a protocol, but it doesnt matter which
  if (!checkRegex.startsWithHttp(sanitisedUrl)) {
    sanitisedUrl = `http://${sanitisedUrl}`;
  }

  const url = new URL(sanitisedUrl);
  const target = extractLastSegment(url.pathname);

  if (target === 'editor' || !Object.values(OntimeView).includes(target as OntimeView)) {
    throw new Error(`Invalid target view: ${target}`);
  }

  return {
    alias,
    target,
    search: url.searchParams.toString(),
    enabled: true,
  };
}

/**
 * the path can contain the stage hash
 * "/team-hash/timer" or "/timer"
 * we need to extract ontime view it targets
 */
function extractLastSegment(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
}
