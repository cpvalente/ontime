import { DatabaseModel, GetInfo, LogOrigin, ProjectData, ProjectFileListResponse } from 'ontime-types';

import { copyFile, rename } from 'fs/promises';
import { join } from 'path';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { logger } from '../../classes/Logger.js';
import { getNetworkInterfaces } from '../../utils/networkInterfaces.js';
import { resolveCorruptDirectory, resolveProjectsDirectory, resolveStylesPath } from '../../setup/index.js';
import { appendToName, ensureDirectory, removeFileExtension } from '../../utils/fileManagement.js';
import { dbModel } from '../../models/dataModel.js';
import { deleteFile } from '../../utils/parserUtils.js';
import { switchDb } from '../../setup/loadDb.js';
import { generateUniqueFileName } from '../../utils/generateUniqueFilename.js';
import { parseJson } from '../../utils/parser.js';

import { initRundown } from '../rundown-service/RundownService.js';
import { appStateProvider } from '../app-state-service/AppStateService.js';
import { runtimeService } from '../runtime-service/RuntimeService.js';
import { oscIntegration } from '../integration-service/OscIntegration.js';
import { httpIntegration } from '../integration-service/HttpIntegration.js';

import { parseProjectFile } from './projectFileUtils.js';
import { doesProjectExist, getPathToProject, getProjectFiles } from './projectServiceUtils.js';
import { parseRundown } from '../../utils/parserFunctions.js';

// init dependencies
init();

/**
 * Ensure services has its dependencies initialized
 */
function init() {
  ensureDirectory(resolveProjectsDirectory);
}

/**
 * Loads a data from a file into the runtime
 */
export async function loadProjectFile(name: string) {
  const filePath = await doesProjectExist(name);
  if (filePath === null) {
    throw new Error('Project file not found');
  }

  // when loading a project file, we allow parsing to fail and interrupt the process
  const fileData = await parseProjectFile(filePath);
  const result = parseJson(fileData);

  if (result.errors.length > 0) {
    logger.warning(LogOrigin.Server, 'Project loaded with errors');

    // move original file to corrupted
    ensureDirectory(resolveCorruptDirectory);
    copyFile(filePath, join(resolveCorruptDirectory, name));

    // rename file to indicate recovery
    const newName = appendToName(filePath, '(recovered)');
    await rename(filePath, newName);
  }

  // change LowDB to point to new file
  await switchDb(filePath, result.data);
  logger.info(LogOrigin.Server, `Loaded project ${name}`);

  // persist the project selection
  await appStateProvider.setLastLoadedProject(name);

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
  const lastLoadedProject = await appStateProvider.getLastLoadedProject();

  return {
    files,
    lastLoadedProject: lastLoadedProject ? removeFileExtension(lastLoadedProject) : '',
  };
}

/**
 * Duplicates an existing project file
 */
export async function duplicateProjectFile(originalFile: string, newFilename: string) {
  const projectFilePath = await doesProjectExist(originalFile);
  if (projectFilePath === null) {
    throw new Error('Project file not found');
  }

  const duplicateProjectFilePath = await doesProjectExist(newFilename);
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
  const projectFilePath = await doesProjectExist(originalFile);
  if (projectFilePath === null) {
    throw new Error('Project file not found');
  }

  const newProjectFilePath = await doesProjectExist(newFilename);
  if (newProjectFilePath !== null) {
    throw new Error(`Project file with name ${newFilename} already exists`);
  }

  const pathToRenamed = getPathToProject(newFilename);
  await rename(projectFilePath, pathToRenamed);

  // Update the last loaded project config if current loaded project is the one being renamed
  const isLoaded = await appStateProvider.isLastLoadedProject(originalFile);
  if (isLoaded) {
    const fileData = await parseProjectFile(pathToRenamed);
    const result = parseJson(fileData);

    // change LowDB to point to new file
    await switchDb(pathToRenamed, result.data);
    logger.info(LogOrigin.Server, `Loaded project ${newFilename}`);

    // persist the project selection
    await appStateProvider.setLastLoadedProject(newFilename);

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
  await switchDb(newFile, data);

  // apply data to running services
  // we dont need to parse since we are creating a new file
  await patchCurrentProject(data);

  // update app state to point to new value
  appStateProvider.setLastLoadedProject(uniqueFileName);

  return uniqueFileName;
}

/**
 * Deletes a project file
 */
export async function deleteProjectFile(filename: string) {
  const isLastLoadedProject = await appStateProvider.isLastLoadedProject(filename);
  if (isLastLoadedProject) {
    throw new Error('Cannot delete currently loaded project');
  }

  const projectFilePath = await doesProjectExist(filename);
  if (projectFilePath === null) {
    throw new Error('Project file not found');
  }

  await deleteFile(projectFilePath);
}

/**
 * Adds business logic to gathering data for the info endpoint
 */
export async function getInfo(): Promise<GetInfo> {
  const { version, serverPort } = DataProvider.getSettings();
  const osc = DataProvider.getOsc();

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars  -- we need to remove the fields before meging
  const { rundown, customFields, ...rest } = data;
  // we can pass some stuff straight to the data provider
  const newData = await DataProvider.mergeIntoData(rest);

  // ... but rundown and custom fields need to be checked
  if (rundown != null) {
    const result = parseRundown(data);
    initRundown(result.rundown, result.customFields);
  }

  return newData;
}
