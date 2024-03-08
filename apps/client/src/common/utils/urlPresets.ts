import isEqual from 'react-fast-compare';
import { Location, resolvePath } from 'react-router-dom';
import { URLPreset } from 'ontime-types';

/**
 * Validates a preset against defined parameters
 * @param {string} preset
 * @returns {{message: string, isValid: boolean}}
 */
export const validateUrlPreset = (preset: string): { message: string; isValid: boolean } => {
  if (preset === '' || preset == null) {
    return { isValid: false, message: 'Preset cannot be empty' };
  }

  if (preset.includes('http') || preset.includes('https') || preset.includes('www')) {
    return { isValid: false, message: 'Preset should not include http, https, www' };
  }

  if (preset.includes('127.0.0.1') || preset.includes('localhost') || preset.includes('0.0.0.0')) {
    return { isValid: false, message: 'Preset should not include hostname' };
  }

  if (preset.includes('editor')) {
    // no editor
    return { isValid: false, message: 'No presets to editor page allowed' };
  }

  return { isValid: true, message: 'ok' };
};

/**
 * Gets the URL to send a preset to
 * @param location
 * @param data
 * @param searchParams
 */
export const getRouteFromPreset = (location: Location, data: URLPreset[], searchParams: URLSearchParams) => {
  const currentURL = location.pathname.substring(1);

  // we need to check if the whole url here is an alias, so we can redirect
  const foundPreset = data.filter((d) => d.alias === currentURL && d.enabled)[0];
  if (foundPreset) {
    return generateUrlFromPreset(foundPreset);
  }

  const presetOnPage = searchParams.get('preset');
  for (const d of data) {
    if (presetOnPage) {
      // if the alias fits the preset on this page, but the URL is different, we redirect user to the new URL
      // if we have the same alias and its enabled and its not empty
      if (d.alias !== '' && d.enabled && d.alias === presetOnPage) {
        const newPath = resolvePath(d.pathAndParams);
        const urlParams = new URLSearchParams(newPath.search);
        urlParams.set('preset', d.alias);
        // we confirm either the url parameters does not match or the url path doesnt
        if (!isEqual(urlParams, searchParams) || newPath.pathname !== location.pathname) {
          // we then redirect to the alias route, since the view listening to this alias has an outdated URL
          return `${newPath.pathname}?${urlParams}`;
        }
      }
    }
  }
  return null;
};

/**
 * Generate URL from an preset
 * @param presetData
 */
export const generateUrlFromPreset = (presetData: URLPreset) => {
  const newPresetPath = resolvePath(presetData.pathAndParams);
  const urlParams = new URLSearchParams(newPresetPath.search);
  urlParams.set('preset', presetData.alias);

  return `${newPresetPath.pathname}?${urlParams}`;
};
