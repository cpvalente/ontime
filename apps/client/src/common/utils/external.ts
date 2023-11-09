// import { Settings } from 'ontime-types';
// import { APP_SETTINGS } from '../api/apiConstants';
// import { ontimeQueryClient } from '../queryClient';

/**
 * @description Resolves format from url and store
 * @return {string|undefined}
 */
export const resolveExternalShow = () => {
  const params = new URL(document.location.href).searchParams;
  const urlOptions = Boolean(params.get('ext'));
  //   const settings: Settings | undefined = ontimeQueryClient.getQueryData(APP_SETTINGS);

  //   return urlOptions || settings?.external;
  return urlOptions;
};

/**
 * @description get the content of external if enabled in url
 * @return {string | false}
 */
export const externalData = (externalData: string, resolver = resolveExternalShow) => {
  if (externalData === '' || !resolver()) {
    return false;
  }
  return externalData;
};
