import { ProjectData, RefetchKey } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { join } from 'node:path';
import { deleteFile } from '../../utils/fileManagement.js';
import { publicDir } from '../../setup/index.js';
import { sendRefetch } from '../../adapters/WebsocketAdapter.js';

/**
 * Gets the stored project data
 */
export function getProjectData(): Readonly<ProjectData> {
  return getDataProvider().getProjectData();
}

/**
 * Patches the current project data
 * Handles deleting the local logo if the logo has been removed
 */
export async function editCurrentProjectData(newData: Partial<ProjectData>) {
  const currentProjectData = getDataProvider().getProjectData();
  const updatedProjectData = await getDataProvider().setProjectData(newData);

  // Delete the old logo if the logo has been removed
  if (!updatedProjectData.logo && currentProjectData.logo) {
    const filePath = join(publicDir.logoDir, currentProjectData.logo);

    deleteFile(filePath).catch((_error) => {
      /** we do not handle this error */
    });
  }

  // Notify the websocket clients to refetch the project data
  setImmediate(() => {
    sendRefetch(RefetchKey.ProjectData);
  });

  return updatedProjectData;
}
