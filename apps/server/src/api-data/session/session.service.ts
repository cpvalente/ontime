import { GetInfo } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { publicFiles } from '../../setup/index.js';
import { getNetworkInterfaces } from '../../utils/networkInterfaces.js';

/**
 * Adds business logic to gathering data for the info endpoint
 */
export async function getInfo(): Promise<GetInfo> {
  const { version, serverPort } = getDataProvider().getSettings();
  const osc = getDataProvider().getOsc();

  // get nif and inject localhost
  const ni = getNetworkInterfaces();
  ni.unshift({ name: 'localhost', address: '127.0.0.1' });

  return {
    networkInterfaces: ni,
    version,
    serverPort,
    osc,
    cssOverride: publicFiles.cssOverride,
  };
}
