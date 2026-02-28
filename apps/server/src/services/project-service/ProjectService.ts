import { copyFile } from 'fs/promises';
import { join } from 'path';

import { DatabaseModel, LogOrigin, ProjectFileListResponse } from 'ontime-types';
import { getErrorMessage, getFirstRundown } from 'ontime-utils';

import { parseCustomFields } from '../../api-data/custom-fields/customFields.parser.js';
import { parseDatabaseModel } from '../../api-data/db/db.parser.js';
import { getCurrentRundown } from '../../api-data/rundown/rundown.dao.js';
import { parseRundowns } from '../../api-data/rundown/rundown.parser.js';
import { initRundown } from '../../api-data/rundown/rundown.service.js';
import { getDataProvider, initPersistence } from '../../classes/data-provider/DataProvider.js';
import { safeMerge } from '../../classes/data-provider/DataProvider.utils.js';
import { logger } from '../../classes/Logger.js';
import { makeNewProject } from '../../models/dataModel.js';
import { demoDb } from '../../models/demoProject.js';
import { config } from '../../setup/config.js';
import { publicDir } from '../../setup/index.js';
import { populateOntimeLogo } from '../../setup/loadOntimeLogo.js';
import {
  appendToName,
  deleteFile,
  dockerSafeRename,
  ensureDirectory,
  ensureJsonExtension,
  generateUniqueFileName,
  getFileNameFromPath,
  removeFileExtension,
} from '../../utils/fileManagement.js';
import { getLastLoaded, isLastLoadedProject, setLastLoaded } from '../app-state-service/AppStateService.js';
import { runtimeService } from '../runtime-service/runtime.service.js';
import {
  doesProjectExist,
  getPathToProject,
  getProjectFiles,
  moveCorruptFile,
  parseJsonFile,
} from './projectServiceUtils.js';

type ProjectState =
  | {
      status: 'PENDING';
      currentProjectName: undefined;
    }
  | {
      status: 'INITIALIZED';
      currentProjectName: string;
    };

let currentProjectState: ProjectState = {
  status: 'PENDING',
  currentProjectName: undefined,
};

// init dependencies
init();

/**
 * Ensure services has its dependencies initialized
 */
function init() {
  ensureDirectory(publicDir.projectsDir);
  ensureDirectory(publicDir.corruptDir);
  ensureDirectory(publicDir.logoDir);
  ensureDirectory(publicDir.migrateDir);
}

export async function getCurrentProject(): Promise<{ filename: string; pathToFile: string }> {
  if (currentProjectState.status === 'PENDING') {
    await initialiseProject();
  }
  // we know the project is loaded since we force initialisation above
  const pathToFile = getPathToProject(currentProjectState.currentProjectName as string);

  return { filename: currentProjectState.currentProjectName as string, pathToFile };
}

/**
 * Private function loads a project file and handles necessary side effects
 * @param projectData
 * @param fileName file name of the project including the extension
 */
async function loadProject(projectData: DatabaseModel, fileName: string, rundownId?: string) {
  // change LowDB to point to new file
  await initPersistence(getPathToProject(fileName), projectData);
  logger.info(LogOrigin.Server, `Loaded project ${fileName}`);

  // stop the runtime service
  runtimeService.stop();

  // load the rundown given by key otherwise load the first in the project
  const rundown =
    rundownId && rundownId in projectData.rundowns
      ? projectData.rundowns[rundownId]
      : getFirstRundown(projectData.rundowns);

  await initRundown(rundown, projectData.customFields, true);

  // persist the project selection
  await setLastLoaded(fileName, rundown.id);

  // update the service state
  currentProjectState = {
    status: 'INITIALIZED',
    currentProjectName: fileName,
  };

  return fileName;
}

/**
 * Loads the demo project
 */
export async function loadDemoProject(): Promise<string> {
  populateOntimeLogo();
  return createProject(config.demoProject, demoDb);
}

/**
 * Private function loads a new, empty project
 * to be composed in the loading functions
 */
async function loadNewProject(): Promise<string> {
  const emptyProject = makeNewProject();
  return createProject(config.newProject, emptyProject);
}

/**
 * Private function handles side effects on corrupted files
 * Corrupted files in this context contain data that failed domain validation
 * @throws
 * @param filePath path to the project type include the fileName and extension
 * @param fileName as extracted from filePath, includes extension
 */
async function handleCorruptedFile(filePath: string, fileName: string): Promise<string> {
  // copy file to corrupted folder
  const copyPath = join(publicDir.corruptDir, fileName);
  await copyFile(filePath, copyPath).catch((_) => {
    /* while we have to catch the error, we dont need to handle it */
  });

  // and make a new file with the recovered data
  const newPath = appendToName(filePath, '(recovered)');
  await dockerSafeRename(filePath, newPath);
  return getFileNameFromPath(newPath);
}

/**
 * Private function handles side effects on migrated files
 * A file was migrated to a newer version, and the old one kept as backup
 * @throws
 * @param filePath path to the project type include the fileName and extension
 * @param fileName as extracted from filePath, includes extension
 */
async function handleMigratedFile(filePath: string, fileName: string): Promise<string> {
  // copy file to migrated folder
  const copyPath = join(publicDir.migrateDir, fileName);
  await copyFile(filePath, copyPath).catch((_) => {
    /* while we have to catch the error, we dont need to handle it */
  });

  // and make a new file with the migrated data
  const newPath = appendToName(filePath, '(migrated)');
  await dockerSafeRename(filePath, newPath);
  return getFileNameFromPath(newPath);
}

/**
 * Coordinates the initial load of a project on app startup
 * This is different from the load project since we need to always load something
 * @returns {Promise<string>} - name of the loaded file
 */
export async function initialiseProject(): Promise<string> {
  // check what was loaded before
  const lastLoaded = await getLastLoaded();

  // in normal circumstances we dont have a previous project if it is the first app start
  // in previousLoaded case we want to load a demo project
  if (!lastLoaded?.projectName) {
    return loadDemoProject();
  }

  try {
    const projectName = await loadProjectFile(lastLoaded.projectName, lastLoaded.rundownId);
    return projectName;
  } catch (error) {
    // if we are here, most likely the json parsing failed and the file is corrupt
    logger.warning(
      LogOrigin.Server,
      `Unable to load previous project ${lastLoaded.projectName}: ${getErrorMessage(error)}`,
    );
    try {
      const pathToFile = getPathToProject(lastLoaded.projectName);
      await moveCorruptFile(pathToFile, lastLoaded.projectName);
    } catch (_) {
      /* while we have to catch the error, we dont need to handle it */
    }
  }

  return loadNewProject();
}

/**
 * Loads a data from a file into the runtime
 * @throws
 * @param fileName file name of the project including the extension
 */
export async function loadProjectFile(fileName: string, rundownId?: string): Promise<string> {
  const filePath = doesProjectExist(fileName);
  if (filePath === null) {
    throw new Error('Project file not found');
  }

  // when loading a project file, we allow parsing to fail and interrupt the process
  const fileData = await parseJsonFile(filePath);
  const result = parseDatabaseModel(fileData);
  let parsedFileName = fileName;

  if (result.migrated) {
    logger.warning(LogOrigin.Server, 'The imported project is migrate, the original file has been backed up');
    parsedFileName = await handleMigratedFile(filePath, parsedFileName);
  } else if (result.errors.length > 0) {
    logger.warning(LogOrigin.Server, 'Project loaded with errors');
    parsedFileName = await handleCorruptedFile(filePath, parsedFileName);
  }

  const projectName = await loadProject(result.data, parsedFileName, rundownId);
  return projectName;
}

/**
 * Gathers data related to the project list
 */
export async function getProjectList(): Promise<ProjectFileListResponse> {
  const files = await getProjectFiles();
  const lastLoaded = await getLastLoaded();

  return {
    files,
    lastLoadedProject: lastLoaded?.projectName ? removeFileExtension(lastLoaded?.projectName) : '',
  };
}

/**
 * Duplicates an existing project file
 */
export async function duplicateProjectFile(originalFile: string, newFilename: string) {
  const projectFilePath = doesProjectExist(originalFile);
  if (projectFilePath === null) {
    throw new Error('Project file not found');
  }

  const duplicateProjectFilePath = doesProjectExist(newFilename);
  if (duplicateProjectFilePath !== null) {
    throw new Error(`Project file with name ${newFilename} already exists`);
  }

  const pathToDuplicate = getPathToProject(newFilename);
  await copyFile(projectFilePath, pathToDuplicate);
  return;
}

/**
 * Renames an existing project file
 * @throws
 */
export async function renameProjectFile(originalFile: string, newFilename: string): Promise<string> {
  const projectFilePath = doesProjectExist(originalFile);
  if (projectFilePath === null) {
    throw new Error('Project file not found');
  }

  const newProjectFilePath = doesProjectExist(newFilename);
  if (newProjectFilePath !== null) {
    throw new Error(`Project file with name ${newFilename} already exists`);
  }

  const pathToRenamed = getPathToProject(newFilename);
  await dockerSafeRename(projectFilePath, pathToRenamed);

  // Update the last loaded project config if current loaded project is the one being renamed
  const isLoaded = await isLastLoadedProject(originalFile);
  if (isLoaded) {
    const fileData = await parseJsonFile(pathToRenamed);
    const projectData = parseDatabaseModel(fileData);

    const newFileName = await loadProject(projectData.data, newFilename);
    return newFileName;
  }
  return newFilename;
}

/**
 * Creates a new project file and applies its result
 * @param fileName file name of the project including the extension
 * @param initialData db to initialize the project with
 */
export async function createProject(fileName: string, initialData: DatabaseModel): Promise<string> {
  const fileNameWithExtension = generateUniqueFileName(publicDir.projectsDir, ensureJsonExtension(fileName));
  await loadProject(initialData, fileNameWithExtension);
  return fileNameWithExtension;
}

/**
 * Creates a new project file from a patch and applies its result
 * @param fileName file name of the project including the extension
 * @param initialData patch of DB to initialize the project with
 */
export async function createProjectWithPatch(fileName: string, initialData: Partial<DatabaseModel>): Promise<string> {
  const newProject = makeNewProject();
  const sanitisedData = safeMerge(newProject, initialData);
  return createProject(fileName, sanitisedData);
}

/**
 * Deletes a project file
 */
export async function deleteProjectFile(filename: string) {
  if (filename === currentProjectState.currentProjectName) {
    throw new Error('Cannot delete currently loaded project');
  }

  const projectFilePath = doesProjectExist(filename);
  if (projectFilePath === null) {
    throw new Error('Project file not found');
  }

  await deleteFile(projectFilePath);
}

/**
 * applies a partial database model
 */
export async function patchCurrentProject(data: Partial<DatabaseModel>) {
  runtimeService.stop();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars  -- we need to remove the fields before merging
  const { rundowns, customFields, ...rest } = data;

  // we can pass some stuff straight to the data provider
  await getDataProvider().mergeIntoData(rest);

  // the rundown depends on custom fields
  // so custom fields needs to be checked first
  if (customFields) {
    const parsedCustomFields = parseCustomFields(data);
    await getDataProvider().mergeIntoData({ customFields: parsedCustomFields });
  }

  // then we can check the rundown
  if (rundowns) {
    // use the already parsed custom fields if available, otherwise fetch from provider
    const projectCustomFields = getDataProvider().getCustomFields();
    const parsedRundowns = parseRundowns(data, projectCustomFields);
    const currentRundown = getCurrentRundown();

    const mergedData = await getDataProvider().mergeIntoData({ rundowns: parsedRundowns });

    // check if the currently loaded rundown was modified
    const didOverrideCurrentRundown = currentRundown.id in parsedRundowns;

    if (didOverrideCurrentRundown) {
      // verify the rundown exists in the merged data before reinitializing
      const updatedCurrentRundown = mergedData.rundowns[currentRundown.id];
      if (updatedCurrentRundown) {
        await initRundown(updatedCurrentRundown, projectCustomFields, true);
      }
    }
  }

  const updatedData = await getDataProvider().getData();
  return updatedData;
}
