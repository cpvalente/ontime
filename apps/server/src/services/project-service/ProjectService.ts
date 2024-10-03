import { DatabaseModel, GetInfo, LogOrigin, ProjectData, ProjectFileListResponse } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { copyFile, rename } from 'fs/promises';

import { logger } from '../../classes/Logger.js';
import { getNetworkInterfaces } from '../../utils/networkInterfaces.js';
import { resolveCorruptDirectory, resolveProjectsDirectory, resolveStylesPath } from '../../setup/index.js';
import {
  appendToName,
  ensureDirectory,
  generateUniqueFileName,
  getFileNameFromPath,
  removeFileExtension,
} from '../../utils/fileManagement.js';
import { dbModel } from '../../models/dataModel.js';
import { deleteFile } from '../../utils/parserUtils.js';
import { parseDatabaseModel } from '../../utils/parser.js';
import { parseRundown } from '../../utils/parserFunctions.js';
import { demoDb } from '../../models/demoProject.js';
import { config } from '../../setup/config.js';
import { getDataProvider, initPersistence } from '../../classes/data-provider/DataProvider.js';

import { initRundown } from '../rundown-service/RundownService.js';
import {
  getLastLoadedProject,
  isLastLoadedProject,
  setLastLoadedProject,
} from '../app-state-service/AppStateService.js';
import { runtimeService } from '../runtime-service/RuntimeService.js';
import { oscIntegration } from '../integration-service/OscIntegration.js';
import { httpIntegration } from '../integration-service/HttpIntegration.js';

import {
  copyCorruptFile,
  doesProjectExist,
  getPathToProject,
  getProjectFiles,
  moveCorruptFile,
  parseJsonFile,
} from './projectServiceUtils.js';

// init dependencies
init();

/**
 * Ensure services has its dependencies initialized
 */
function init() {
  ensureDirectory(resolveProjectsDirectory);
  ensureDirectory(resolveCorruptDirectory);
}

export async function getCurrentProject() {
  const filename = await getLastLoadedProject();
  const pathToFile = getPathToProject(filename);

  return { filename, pathToFile };
}

/**
 * Private function loads a demo project
 * to be composed in the loading functions
 */
async function loadDemoProject(): Promise<string> {
  const pathToNewFile = generateUniqueFileName(resolveProjectsDirectory, config.demoProject);
  await initPersistence(getPathToProject(pathToNewFile), demoDb);
  const newName = getFileNameFromPath(pathToNewFile);
  await setLastLoadedProject(newName);
  return newName;
}

/**
 * Private function loads a new, empty project
 * to be composed in the loading functions
 */
async function loadNewProject(): Promise<string> {
  const pathToNewFile = generateUniqueFileName(resolveProjectsDirectory, config.newProject);
  await initPersistence(getPathToProject(pathToNewFile), dbModel);
  const newName = getFileNameFromPath(pathToNewFile);
  await setLastLoadedProject(newName);
  return newName;
}

/**
 * Private function handles side effects on currupted files
 * Corrupted files in this context contain data that failed domain validation
 */
async function handleCorruptedFile(filePath: string, fileName: string): Promise<string> {
  // copy file to corrupted folder
  await copyCorruptFile(filePath, fileName).catch((_) => {
    /* while we have to catch the error, we dont need to handle it */
  });

  // and make a new file with the recovered data
  const newPath = appendToName(filePath, '(recovered)');
  await rename(filePath, newPath);
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

  if (!previousProject) {
    return loadDemoProject();
  }

  // try and load the previous project
  const filePath = doesProjectExist(previousProject);
  if (filePath === null) {
    logger.warning(LogOrigin.Server, `Previous project file ${previousProject} not found`);
    return loadNewProject();
  }

  try {
    const fileData = await parseJsonFile(filePath);
    const result = parseDatabaseModel(fileData);
    let parsedFileName = previousProject;
    let parsedFilePath = filePath;

    if (result.errors.length > 0) {
      logger.warning(LogOrigin.Server, 'Project loaded with errors');
      parsedFileName = await handleCorruptedFile(filePath, previousProject);
      parsedFilePath = getPathToProject(parsedFileName);
    }

    await initPersistence(parsedFilePath, result.data);
    await setLastLoadedProject(parsedFileName);
    return parsedFileName;
  } catch (error) {
    logger.warning(LogOrigin.Server, `Unable to load previous project ${previousProject}: ${getErrorMessage(error)}`);
    await moveCorruptFile(filePath, previousProject).catch((_) => {
      /* while we have to catch the error, we dont need to handle it */
    });

    return loadNewProject();
  }
}

/**
 * Loads a data from a file into the runtime
 */
export async function loadProjectFile(name: string) {
  const filePath = doesProjectExist(name);
  if (filePath === null) {
    throw new Error('Project file not found');
  }

  // when loading a project file, we allow parsing to fail and interrupt the process
  const fileData = await parseJsonFile(filePath);
  const result = parseDatabaseModel(fileData);
  let parsedFileName = name;
  let parsedFilePath = filePath;

  if (result.errors.length > 0) {
    logger.warning(LogOrigin.Server, 'Project loaded with errors');
    parsedFileName = await handleCorruptedFile(filePath, name);
    parsedFilePath = getPathToProject(parsedFileName);
  }

  // change LowDB to point to new file
  await initPersistence(parsedFilePath, result.data);
  logger.info(LogOrigin.Server, `Loaded project ${parsedFileName}`);

  // persist the project selection
  await setLastLoadedProject(parsedFileName);

  // since load happens at runtime, we need to update the services that depend on the data

  // apply data model
  runtimeService.stop();

  const { rundown, customFields, osc, http } = result.data;

  // apply the rundown
  initRundown(rundown, customFields);

  // apply integrations
  oscIntegration.init(osc);
  httpIntegration.init(http);
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
export async function renameProjectFile(originalFile: string, newFilename: string) {
  const projectFilePath = doesProjectExist(originalFile);
  if (projectFilePath === null) {
    throw new Error('Project file not found');
  }

  const newProjectFilePath = doesProjectExist(newFilename);
  if (newProjectFilePath !== null) {
    throw new Error(`Project file with name ${newFilename} already exists`);
  }

  const pathToRenamed = getPathToProject(newFilename);
  await rename(projectFilePath, pathToRenamed);

  // Update the last loaded project config if current loaded project is the one being renamed
  const isLoaded = await isLastLoadedProject(originalFile);
  if (isLoaded) {
    const fileData = await parseJsonFile(pathToRenamed);
    const result = parseDatabaseModel(fileData);

    // change LowDB to point to new file
    await initPersistence(pathToRenamed, result.data);
    logger.info(LogOrigin.Server, `Loaded project ${newFilename}`);

    // persist the project selection
    await setLastLoadedProject(newFilename);

    // apply data model
    runtimeService.stop();

    const { rundown, customFields, osc, http } = result.data;

    // apply the rundown
    initRundown(rundown, customFields);

    // apply integrations
    oscIntegration.init(osc);
    httpIntegration.init(http);
  }
}

/**
 * Creates a new project file and applies its result
 */
export async function createProject(filename: string, projectData: ProjectData) {
  const data: DatabaseModel = {
    ...dbModel,
    project: {
      ...dbModel.project,
      ...projectData,
    },
  };

  const uniqueFileName = generateUniqueFileName(resolveProjectsDirectory, filename);
  const newFile = getPathToProject(uniqueFileName);

  // change LowDB to point to new file
  await initPersistence(newFile, data);

  // apply data to running services
  // we dont need to parse since we are creating a new file
  await patchCurrentProject(data);

  // update app state to point to new value
  setLastLoadedProject(uniqueFileName);

  return uniqueFileName;
}

/**
 * Deletes a project file
 */
export async function deleteProjectFile(filename: string) {
  const isPreviousProject = await isLastLoadedProject(filename);
  if (isPreviousProject) {
    throw new Error('Cannot delete currently loaded project');
  }

  const projectFilePath = doesProjectExist(filename);
  if (projectFilePath === null) {
    throw new Error('Project file not found');
  }

  await deleteFile(projectFilePath);
}

/**
 * Adds business logic to gathering data for the info endpoint
 */
export async function getInfo(): Promise<GetInfo> {
  const { version, serverPort } = getDataProvider().getSettings();
  const osc = getDataProvider().getOsc();

  // get nif and inject localhost
  const ni = getNetworkInterfaces();
  ni.unshift({ name: 'localhost', address: '127.0.0.1' });
  const cssOverride = resolveStylesPath;

  return {
    networkInterfaces: ni,
    version,
    serverPort,
    osc,
    cssOverride,
  };
}

/**
 * applies a partial database model
 */
export async function patchCurrentProject(data: Partial<DatabaseModel>) {
  runtimeService.stop();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars  -- we need to remove the fields before merging
  const { rundown, customFields, ...rest } = data;
  // we can pass some stuff straight to the data provider
  const newData = await getDataProvider().mergeIntoData(rest);

  // ... but rundown and custom fields need to be checked
  if (rundown != null) {
    const result = parseRundown(data);
    initRundown(result.rundown, result.customFields);
  }

  return newData;
}
