import { Path, resolvePath } from 'react-router-dom';
import { URLPreset } from 'ontime-types';

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
export function getRouteFromPreset(location: Path, urlPresets: URLPreset[]) {
  // current url is the pathname without the leading slash
  const currentURL = location.pathname.substring(1);

  // we need to check if the whole url is an alias
  const foundPreset = urlPresets.find((preset) => preset.alias === removeTrailingSlash(currentURL) && preset.enabled);
  if (foundPreset) {
    // if so, we can redirect to the preset path
    return generatePathFromPreset(foundPreset.pathAndParams, foundPreset.alias);
  }

  // if the current url is not an alias, we check if the alias is in the search parameters
  const searchParams = new URLSearchParams(location.search);

  const presetOnPage = searchParams.get('alias');
  if (!presetOnPage) {
    return null;
  }

  for (const preset of urlPresets) {
    // if the page has a known enabled alias, we check if we need to redirect
    if (preset.alias === presetOnPage && preset.enabled) {
      const newPath = generatePathFromPreset(preset.pathAndParams, preset.alias);
      const currentPath = `${location.pathname}${location.search}`.substring(1);
      if (currentPath !== newPath) {
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
export function generatePathFromPreset(pathAndParams: string, alias: string): string {
  const path = resolvePath(pathAndParams);
  const searchParams = new URLSearchParams(path.search);

  // save the alias so we have a reference to it being a preset and can update if necessary
  searchParams.set('alias', alias);

  // return path concatenated without the leading slash
  return `${path.pathname}?${searchParams}`.substring(1);
}
