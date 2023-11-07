import isEqual from 'react-fast-compare';
import { Location, resolvePath } from 'react-router-dom';
import { Alias } from 'ontime-types';

/**
 * Validates an alias against defined parameters
 * @param {string} alias
 * @returns {{message: string, status: boolean}}
 */
export const validateAlias = (alias: string) => {
  const valid = { status: true, message: 'ok' };

  if (alias === '' || alias == null) {
    // cannot be empty
    valid.status = false;
    valid.message = 'should not be empty';
  } else if (alias.includes('http') || alias.includes('https') || alias.includes('www')) {
    // cannot contain http, https or www
    valid.status = false;
    valid.message = 'should not include http, https, www';
  } else if (alias.includes('127.0.0.1') || alias.includes('localhost') || alias.includes('0.0.0.0')) {
    // aliases cannot contain hostname
    valid.status = false;
    valid.message = 'should not include hostname';
  } else if (alias.includes('editor')) {
    // no editor
    valid.status = false;
    valid.message = 'No aliases to editor page allowed';
  }

  return valid;
};

/**
 * Gets the URL to send an alias to
 * @param location
 * @param data
 * @param searchParams
 */
export const getAliasRoute = (location: Location, data: Alias[], searchParams: URLSearchParams) => {
  const currentURL = location.pathname.substring(1);
  // we need to check if the whole url here is an alias, so we can redirect
  const foundAlias = data.filter((d) => d.alias === currentURL && d.enabled)[0];
  if (foundAlias) {
    return generateURLFromAlias(foundAlias);
  }
  const aliasOnPage = searchParams.get('alias');
  for (const d of data) {
    if (aliasOnPage) {
      // if the alias fits the alias on this page, but the URL is different, we redirect user to the new URL
      // if we have the same alias and its enabled and its not empty
      if (d.alias !== '' && d.enabled && d.alias === aliasOnPage) {
        const newAliasPath = resolvePath(d.pathAndParams);
        const urlParams = new URLSearchParams(newAliasPath.search);
        urlParams.set('alias', d.alias);
        // we confirm either the url parameters does not match or the url path doesnt
        if (!isEqual(urlParams, searchParams) || newAliasPath.pathname !== location.pathname) {
          // we then redirect to the alias route, since the view listening to this alias has an outdated URL
          return `${newAliasPath.pathname}?${urlParams}`;
        }
      }
    }
  }
  return null;
};

/**
 * Generate URL from an alias
 * @param aliasData
 */
export const generateURLFromAlias = (aliasData: Alias) => {
  const newAliasPath = resolvePath(aliasData.pathAndParams);
  const urlParams = new URLSearchParams(newAliasPath.search);
  urlParams.set('alias', aliasData.alias);

  return `${newAliasPath.pathname}?${urlParams}`;
};
