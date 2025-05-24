import { DatabaseModel, LogOrigin, ProjectData, ProjectFileListResponse } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { join } from 'path';
import { copyFile } from 'fs/promises';

import { logger } from '../../classes/Logger.js';
import { publicDir } from '../../setup/index.js';
import {
  appendToName,
  dockerSafeRename,
  ensureDirectory,
  ensureJsonExtension,
  generateUniqueFileName,
  getFileNameFromPath,
  removeFileExtension,
} from '../../utils/fileManagement.js';
import { dbModel } from '../../models/dataModel.js';
import { deleteFile } from '../../utils/parserUtils.js';
import { parseDatabaseModel } from '../../utils/parser.js';
import { parseRundowns } from '../../api-data/rundown/rundown.parser.js';
import { demoDb } from '../../models/demoProject.js';
import { config } from '../../setup/config.js';
import { getDataProvider, initPersistence } from '../../classes/data-provider/DataProvider.js';
import { safeMerge } from '../../classes/data-provider/DataProvider.utils.js';

import { initRundown } from '../rundown-service/RundownService.js';
import {
  getLastLoadedProject,
  isLastLoadedProject,
  setLastLoadedProject,
} from '../app-state-service/AppStateService.js';
import { runtimeService } from '../runtime-service/RuntimeService.js';
import { getFirstRundown } from '../rundown-service/rundownUtils.js';

import {
  copyCorruptFile,
  doesProjectExist,
  getPathToProject,
  getProjectFiles,
  moveCorruptFile,
  parseJsonFile,
} from './projectServiceUtils.js';
import { replaceUrlPresets } from '../../api-data/url-presets/urlPreset.service.js';

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
async function loadProject(projectData: DatabaseModel, fileName: string) {
  // change LowDB to point to new file
  await initPersistence(getPathToProject(fileName), projectData);
  logger.info(LogOrigin.Server, `Loaded project ${fileName}`);

  // stop the runtime service
  runtimeService.stop();

  // reload presets to refresh hashed values
  await replaceUrlPresets(projectData.urlPresets);

  // load the first rundown in the project
  const firstRundown = getFirstRundown(projectData.rundowns);
  await initRundown(firstRundown, projectData.customFields);

  // persist the project selection
  await setLastLoadedProject(fileName);

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
  return createProject(config.demoProject, demoDb);
}

/**
 * Private function loads a new, empty project
 * to be composed in the loading functions
 */
async function loadNewProject(): Promise<string> {
  return createProject(config.newProject, dbModel);
}

/**
 * Private function handles side effects on corrupted files
 * Corrupted files in this context contain data that failed domain validation
 * @param filePath path to the project type include the fileName and extension
 * @param fileName as extracted from filePath, includes extension
 */
async function handleCorruptedFile(filePath: string, fileName: string): Promise<string> {
  // copy file to corrupted folder
  await copyCorruptFile(filePath, fileName).catch((_) => {
    /* while we have to catch the error, we dont need to handle it */
  });

  // and make a new file with the recovered data
  const newPath = appendToName(filePath, '(recovered)');
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
  const previousProject = await getLastLoadedProject();

  // in normal circumstances we dont have a previous project if it is the first app start
  // in which case we want to load a demo project
  if (!previousProject) {
    return loadDemoProject();
  }
  try {
    const projectName = await loadProjectFile(previousProject);
    return projectName;
  } catch (error) {
    // if we are here, most likely the json parsing failed and the file is corrupt
    logger.warning(LogOrigin.Server, `Unable to load previous project ${previousProject}: ${getErrorMessage(error)}`);
    try {
      const pathToFile = getPathToProject(previousProject);
      await moveCorruptFile(pathToFile, previousProject);
    } catch (_) {
      /* while we have to catch the error, we dont need to handle it */
    }
  }

  return loadNewProject();
}

/**
 * Loads a data from a file into the runtime
 * @param fileName file name of the project including the extension
 */
export async function loadProjectFile(fileName: string): Promise<string> {
  const filePath = doesProjectExist(fileName);
  if (filePath === null) {
    throw new Error('Project file not found');
  }

  // when loading a project file, we allow parsing to fail and interrupt the process
  const fileData = await parseJsonFile(filePath);
  const result = parseDatabaseModel(fileData);
  let parsedFileName = fileName;

  if (result.errors.length > 0) {
    logger.warning(LogOrigin.Server, 'Project loaded with errors');
    parsedFileName = await handleCorruptedFile(filePath, fileName);
  }

  const projectName = await loadProject(result.data, parsedFileName);
  return projectName;
}

/**
 * Gathers data related to the project list
 */
export async function getProjectList(): Promise<ProjectFileListResponse> {
  const files = await getProjectFiles();
  const lastLoadedProject = await getLastLoadedProject();

  return {
    files,
    lastLoadedProject: lastLoadedProject ? removeFileExtension(lastLoadedProject) : '',
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
  return copyFile(projectFilePath, pathToDuplicate);
}

/**
 * Renames an existing project file
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
export async function createProject(fileName: string, initialData: Partial<DatabaseModel>): Promise<string> {
  const data = safeMerge(dbModel, initialData);
  const fileNameWithExtension = generateUniqueFileName(publicDir.projectsDir, ensureJsonExtension(fileName));
  await loadProject(data, fileNameWithExtension);
  return fileNameWithExtension;
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

  // ... but rundown and custom fields need to be checked
  if (rundowns != null) {
    const result = parseRundowns(data);
    /**
     * The user may have multiple rundowns
     * We currently ignore all other rundowns
     */
    const firstRundown = getFirstRundown(result.rundowns);
    await initRundown(firstRundown, result.customFields);
  }

  const updatedData = await getDataProvider().getData();
  return updatedData;
}

/**
 * Changes the current project data
 * it handles invalidating the necessary data
 */
export async function editCurrentProjectData(newData: Partial<ProjectData>) {
  const currentProjectData = getDataProvider().getProjectData();
  const updatedProjectData = await getDataProvider().setProjectData(newData);

  // Delete the old logo if the logo has been removed
  if (!updatedProjectData.projectLogo && currentProjectData.projectLogo) {
    const filePath = join(publicDir.logoDir, currentProjectData.projectLogo);

    deleteFile(filePath).catch((_error) => {
      /** we do not handle this error */
    });
  }

  return updatedProjectData;
}
