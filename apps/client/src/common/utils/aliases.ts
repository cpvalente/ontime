import { Alias } from 'ontime-types';
import isEqual from 'react-fast-compare';
import { Location, resolvePath } from 'react-router-dom';

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

export const getAliasRoute = (location: Location, data: Alias[], searchParams: URLSearchParams) => {
  const currentURL = location.pathname.substring(1);
  let redirectURL = '';
  // we need to check if the whole url here is an alias, so we can redirect
  const foundAlias = data.filter((d) => d.alias === currentURL && d.enabled)[0];
  if (foundAlias) {
    redirectURL = generateURLFromAlias(foundAlias);
    return redirectURL;
  } else {
    for (const d of data) {
      const aliasOnPage = searchParams.get('alias');
      if (aliasOnPage) {
        // if the alias fits the alias on this page, but the URL is diferent, we redirect user to the new URL
        // if we have the same alias and its enabled and its not empty
        if (d.alias !== '' && d.enabled && d.alias === aliasOnPage) {
          const newAliasPath = resolvePath(d.pathAndParams);
          const urlParams = new URLSearchParams(newAliasPath.search);
          urlParams.set('alias', d.alias);
          // we confirm either the url parameters does not match or the url path doesnt
          if (!isEqual(urlParams, searchParams) || newAliasPath.pathname !== location.pathname) {
            // we then redirect to the alias route, since the view listening to this alias has an outdated URL
            redirectURL = `${newAliasPath.pathname}?${urlParams.toString()}`;
            return redirectURL;
          }
        }
      }
    }
  }
  return redirectURL;
};
const generateURLFromAlias = (aliasData: Alias) => {
  const newAliasPath = resolvePath(aliasData.pathAndParams);
  const urlParams = new URLSearchParams(newAliasPath.search);
  urlParams.set('alias', aliasData.alias);

  return `${newAliasPath.pathname}?${urlParams.toString()}`;
};
