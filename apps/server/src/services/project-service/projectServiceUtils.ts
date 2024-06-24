import { ProjectFile } from 'ontime-types';

import { stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

import { resolveProjectsDirectory } from '../../setup/index.js';
import { filterProjectFiles } from './projectFileUtils.js';
import { getFilesFromFolder, removeFileExtension } from '../../utils/fileManagement.js';
import { moveUploadedFile } from '../../utils/upload.js';

/**
 * Handles the upload of a new project file
 * @param filePath
 * @param name
 * @returns
 */
export async function upload(filePath: string, name: string) {
  const newFilePath = join(resolveProjectsDirectory, name);
  await moveUploadedFile(filePath, newFilePath);
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

  // current project must exist
  if (projectFiles.filename) {
    if (!doesProjectExist(projectFiles.filename)) {
      errors.push('Project file does not exist');
    }
  }

  // new project must NOT exist
  if (projectFiles.newFilename) {
    if (doesProjectExist(projectFiles.newFilename)) {
      errors.push('New project file already exists');
    }
  }

  return errors;
};

/**
 * Returns the absolute path to a project file
 */
export function getPathToProject(name: string): string {
  return join(resolveProjectsDirectory, name);
}
