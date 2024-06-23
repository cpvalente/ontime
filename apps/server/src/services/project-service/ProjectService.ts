import { DatabaseModel, GetInfo, ProjectData, ProjectFile, ProjectFileListResponse } from 'ontime-types';

import { copyFile, rename, stat, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

import { initRundown } from '../rundown-service/RundownService.js';
import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { runtimeService } from '../runtime-service/RuntimeService.js';
import { getNetworkInterfaces } from '../../utils/networkInterfaces.js';
import { appStatePath, resolveProjectsDirectory, resolveStylesPath } from '../../setup/index.js';
import { filterProjectFiles, parseProjectFile } from './projectFileUtils.js';
import { appStateService } from '../app-state-service/AppStateService.js';
import {
  checkIfFileExists,
  ensureDirectory,
  getFilesFromFolder,
  removeFileExtension,
} from '../../utils/fileManagement.js';
import { dbModel } from '../../models/dataModel.js';
import { deleteFile } from '../../utils/parserUtils.js';
import { switchDb } from '../../setup/loadDb.js';

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
  const filePath = join(resolveProjectsDirectory, name);
  const data = parseProjectFile(filePath);

  // change LowDB to point to new file
  await switchDb(name);

  // apply data model
  await applyDataModel(data, options);

  // persist the project selection
  await appStateService.updateDatabaseConfig(appStatePath, name);
}

/**
 * Copies a file from upload folder to the projects folder
 * @param filePath
 * @param name
 * @returns
 */
export async function handleUploadedFile(filePath: string, name: string) {
  const newFilePath = join(resolveProjectsDirectory, name);
  await rename(filePath, newFilePath);
  await deleteFile(filePath);
  return name;
}

/**
 * Asynchronously retrieves and returns an array of project files from the 'uploads' folder.
 * Each file in the 'uploads' folder is checked, and only those with a '.json' extension are processed.
 * For each qualifying file, its metadata is retrieved, including filename, creation time, and last modification time.
 *
 * @returns {Promise<Array<ProjectFile>>} A promise that resolves to an array of ProjectFile objects,
 *                                        each representing a file in the 'uploads' folder with its metadata.
 *                                        The metadata includes the filename, creation or overwriting time (updatedAt)
 *
 * @throws {Error} Throws an error if there is an issue in reading the directory or fetching file statistics.
 */
export async function getProjectFiles(): Promise<ProjectFile[]> {
  const allFiles = await getFilesFromFolder(resolveProjectsDirectory);
  const filteredFiles = filterProjectFiles(allFiles);

  const projectFiles: ProjectFile[] = [];
  for (const file of filteredFiles) {
    const filePath = join(resolveProjectsDirectory, file);
    const stats = await stat(filePath);

    projectFiles.push({
      filename: removeFileExtension(file),
      updatedAt: stats.mtime.toISOString(),
    });
  }

  return projectFiles;
}

export async function getLoadedProject(): Promise<string> {
  const appState = await appStateService.get(appStatePath);

  // TODO: we likely want a better handling of this case
  // the file may no longer exist in the directory
  const filePath = join(resolveProjectsDirectory, appState.lastLoadedProject);
  if (!checkIfFileExists(filePath)) {
    await appStateService.updateDatabaseConfig(appStatePath, '');
    return '';
  }

  return appState.lastLoadedProject;
}

/**
 * Gathers data related to the project list
 */
export async function getProjectList(): Promise<ProjectFileListResponse> {
  const files = await getProjectFiles();
  const projectFile = await getLoadedProject();

  return {
    files,
    lastLoadedProject: removeFileExtension(projectFile),
  };
}

/**
 * Duplicates an existing project file
 */
export async function duplicateProjectFile(existingProjectFile: string, newProjectFile: string) {
  const projectFilePath = join(resolveProjectsDirectory, existingProjectFile);
  const duplicateProjectFilePath = join(resolveProjectsDirectory, newProjectFile);

  return copyFile(projectFilePath, duplicateProjectFilePath);
}

/**
 * Renames an existing project file
 */
export async function renameProjectFile(existingProjectFile: string, newName: string) {
  const projectFilePath = join(resolveProjectsDirectory, existingProjectFile);
  const newProjectFilePath = join(resolveProjectsDirectory, newName);

  // Update the last loaded project config if current loaded project is the one being renamed
  // we need to do this before renaming
  const lastLoadedProject = await getLoadedProject();

  await rename(projectFilePath, newProjectFilePath);

  if (lastLoadedProject === existingProjectFile) {
    await appStateService.updateDatabaseConfig(appStatePath, newName);
  }
}

/**
 * Creates a new project file and applies its result
 */
export async function createProjectFile(filename: string, projectData: ProjectData) {
  const data = {
    ...dbModel,
    project: {
      ...dbModel.project,
      ...projectData,
    },
  };

  // create new file
  const newFile = join(resolveProjectsDirectory, filename);
  await writeFile(newFile, JSON.stringify(data));

  // change LowDB to point to new file
  await switchDb(filename);

  // apply its data
  await applyDataModel(data);

  appStateService.updateDatabaseConfig(appStatePath, filename);
}

/**
 * Deletes a project file
 */
export async function deleteProjectFile(filename: string) {
  const projectFilePath = join(resolveProjectsDirectory, filename);
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
 * Business logic for resolving a string
 */
export function extractPin(value: string | undefined | null, fallback: string | null): string | null {
  if (value === null) {
    return value;
  }
  if (typeof value === 'undefined') {
    return fallback;
  }
  if (value.length === 0) {
    return null;
  }
  return value;
}

/**
 * applies a partial database model
 */
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

/**
 * Checks whether a project of a given name exists
 * @param name
 */
export function doesProjectExist(name: string): boolean {
  const projectFilePath = join(resolveProjectsDirectory, name);
  return existsSync(projectFilePath);
}

/**
 * @description Validates the existence of project files.
 * @param {object} projectFiles
 * @param {string} projectFiles.projectFilename
 * @param {string} projectFiles.newFilename
 *
 * @returns {Promise<Array<string>>} Array of errors
 *
 */
export const validateProjectFiles = (projectFiles: { filename?: string; newFilename?: string }): Array<string> => {
  const errors: string[] = [];

  if (projectFiles.filename) {
    const projectFilePath = join(resolveProjectsDirectory, projectFiles.filename);

    if (!existsSync(projectFilePath)) {
      errors.push('Project file does not exist');
    }
  }

  if (projectFiles.newFilename) {
    const projectFilePath = join(resolveProjectsDirectory, projectFiles.newFilename);

    if (existsSync(projectFilePath)) {
      errors.push('New project file already exists');
    }
  }

  return errors;
};

/**
 * Get current project title or fallback
 */
export function getProjectTitle(): string {
  const { title } = DataProvider.getProjectData();
  return title || 'ontime data';
}
