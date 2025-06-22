import { ProjectData } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

/**
 * Gets a copy of the stored project data
 */
export function getProjectData(): ProjectData {
  return structuredClone(getDataProvider().getProjectData());
}
