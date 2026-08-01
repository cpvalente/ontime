import { join } from 'node:path';

import { ProjectData, RefetchKey } from 'ontime-types';

import { sendRefetch } from '../../adapters/WebsocketAdapter.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { publicDir } from '../../setup/index.js';
import { deleteFile } from '../../utils/fileManagement.js';

/**
 * Gets the stored project data
 */
export function getProjectData(): Readonly<ProjectData> {
  return getDataProvider().getProjectData();
}

/**
 * Patches the current project data
 */
export async function editCurrentProjectData(newData: Partial<ProjectData>) {
  const currentProjectData = getDataProvider().getProjectData();
  const updatedProjectData = await getDataProvider().setProjectData(newData);

  if (currentProjectData.logo && currentProjectData.logo !== updatedProjectData.logo) {
    deleteFile(join(publicDir.logoDir, currentProjectData.logo));
  }

  // Notify the websocket clients to refetch the project data
  setImmediate(() => {
    sendRefetch(RefetchKey.ProjectData);
  });

  return updatedProjectData;
}
