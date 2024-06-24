import { DatabaseModel, GetInfo, ProjectData, ProjectFileListResponse } from 'ontime-types';

import { copyFile, rename } from 'fs/promises';

import { initRundown } from '../rundown-service/RundownService.js';
import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { runtimeService } from '../runtime-service/RuntimeService.js';
import { getNetworkInterfaces } from '../../utils/networkInterfaces.js';
import { resolveProjectsDirectory, resolveStylesPath } from '../../setup/index.js';
import { parseProjectFile } from './projectFileUtils.js';
import { appStateProvider } from '../app-state-service/AppStateService.js';
import { ensureDirectory, removeFileExtension } from '../../utils/fileManagement.js';
import { dbModel } from '../../models/dataModel.js';
import { deleteFile } from '../../utils/parserUtils.js';
import { switchDb } from '../../setup/loadDb.js';
import { getPathToProject, getProjectFiles } from './projectServiceUtils.js';
import { parseJson } from '../../utils/parser.js';

// init dependencies
init();

/**
 * Ensure services has its dependencies initialized
 */
function init() {
  ensureDirectory(resolveProjectsDirectory);
}

type Options = {
  onlyRundown?: 'true' | 'false';
};

/**
 * Handles a file from the upload folder and applies its data
 */
export async function applyProjectFile(name: string, options?: Options) {
  const filePath = getPathToProject(name);
  const data = parseProjectFile(filePath);

  const result = parseJson(data);

  // change LowDB to point to new file
  await switchDb(filePath, result.data);

  // apply data model
  await applyDataModel(data, options);

  // persist the project selection
  await appStateProvider.updateDatabaseConfig(name);
}

/**
 * Gathers data related to the project list
 */
export async function getProjectList(): Promise<ProjectFileListResponse> {
  const files = await getProjectFiles();
  const lastLoadedProject = await appStateProvider.getLastLoadedProject();

  return {
    files,
    lastLoadedProject: removeFileExtension(lastLoadedProject),
  };
}

/**
 * Duplicates an existing project file
 */
export async function duplicateProjectFile(existingProjectFile: string, newProjectFile: string) {
  const projectFilePath = getPathToProject(existingProjectFile);
  const duplicateProjectFilePath = getPathToProject(newProjectFile);

  return copyFile(projectFilePath, duplicateProjectFilePath);
}

/**
 * Renames an existing project file
 */
export async function renameProjectFile(existingProjectFile: string, newName: string) {
  const projectFilePath = getPathToProject(existingProjectFile);
  const newProjectFilePath = getPathToProject(newName);

  await rename(projectFilePath, newProjectFilePath);

  // Update the last loaded project config if current loaded project is the one being renamed
  const lastLoadedProject = await appStateProvider.getLastLoadedProject();

  if (lastLoadedProject === existingProjectFile) {
    await appStateProvider.updateDatabaseConfig(newName);
  }
}

/**
 * Creates a new project file and applies its result
 */
export async function createProject(filename: string, projectData: ProjectData) {
  const data = {
    ...dbModel,
    project: {
      ...dbModel.project,
      ...projectData,
    },
  };

  const newFile = getPathToProject(filename);

  // change LowDB to point to new file
  await switchDb(newFile, data);

  // apply data to running services
  // we dont need to parse since we are creating a new file
  await applyDataModel(data);

  // update app state to point to new value
  appStateProvider.updateDatabaseConfig(filename);
}

/**
 * Deletes a project file
 */
export async function deleteProjectFile(filename: string) {
  const projectFilePath = getPathToProject(filename);
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
// TODO: should be private as part of a load
export async function applyDataModel(data: Partial<DatabaseModel>, _options?: Options) {
  runtimeService.stop();

  // TODO: allow partial project merge from options
  const { rundown, customFields, ...rest } = data;
  const newData = await DataProvider.mergeIntoData(rest);

  if (rundown != null) {
    initRundown(rundown, customFields ?? {});
  }

  return newData;
}
