import { basename, join } from 'node:path';

import { ProjectData, RefetchKey } from 'ontime-types';

import { getDataProvider, getFileToRead } from '../../classes/data-provider/DataProvider.js';
import { notifyChange } from '../../services/change-service/change.service.js';
import { isLogoUsedInOtherProject } from '../../services/project-service/project.utils.js';
import { publicDir, srcFiles } from '../../setup/index.js';
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
    await deleteUnusedLogo(currentProjectData.logo);
  }

  notifyChange(RefetchKey.ProjectData);

  return updatedProjectData;
}

/**
 * Deletes a logo unless it is the bundled demo logo or another project still references it
 */
async function deleteUnusedLogo(logo: string) {
  if (logo === basename(srcFiles.logo)) {
    return;
  }

  // the loaded project saves with a delay, flushing it ensures its file no longer references the old logo
  await getFileToRead();

  // check if the logo is being used in other files
  const hasReferences = await isLogoUsedInOtherProject(logo);
  if (hasReferences) {
    return;
  }

  await deleteFile(join(publicDir.logoDir, logo));
}
