import { join } from 'node:path';

import { ProjectData, RefetchKey } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { notifyChange } from '../../services/change-service/change.service.js';
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

  notifyChange(RefetchKey.ProjectData);

  return updatedProjectData;
}
