import { DatabaseModel, MaybeString, ProjectFile } from 'ontime-types';

import { existsSync } from 'fs';
import { copyFile, readFile, rename, stat } from 'fs/promises';
import { extname, join } from 'path';

import { publicDir } from '../../setup/index.js';
import { getFilesFromFolder, removeFileExtension } from '../../utils/fileManagement.js';

/**
 * Handles the upload of a new project file
 * @param filePath
 * @param name
 */
export async function handleUploaded(filePath: string, name: string) {
  const newFilePath = join(publicDir.projectsDir, name);
  await rename(filePath, newFilePath);
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
  const allFiles = await getFilesFromFolder(publicDir.projectsDir);
  const filteredFiles = filterProjectFiles(allFiles);

  const projectFiles: ProjectFile[] = [];
  for (const file of filteredFiles) {
    const filePath = join(publicDir.projectsDir, file);
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
export function doesProjectExist(name: string): MaybeString {
  const projectFilePath = getPathToProject(name);
  if (existsSync(projectFilePath)) {
    return projectFilePath;
  }
  return null;
}

/**
 * Returns the absolute path to a project file
 */
export function getPathToProject(name: string): string {
  return join(publicDir.projectsDir, name);
}

/**
 * Makes a copy of a given project to the corrupted directory
 */
export async function copyCorruptFile(filePath: string, name: string): Promise<void> {
  const newPath = join(publicDir.corruptDir, name);
  return copyFile(filePath, newPath);
}

/**
 * Moves a file permanently to the corrupted directory
 */
export async function moveCorruptFile(filePath: string, name: string): Promise<void> {
  const newPath = join(publicDir.corruptDir, name);
  return rename(filePath, newPath);
}

/**
 * Given an array of file names, filters out any files that do not have a '.json' extension.
 * We assume these are project files
 */
export function filterProjectFiles(files: Array<string>): Array<string> {
  return files.filter((file) => {
    const ext = extname(file).toLowerCase();
    return ext === '.json';
  });
}

/**
 * Parses a project file and returns the JSON object
 * @throws It will throw an error if it cannot read or parse the file
 */
export async function parseJsonFile(filePath: string): Promise<Partial<DatabaseModel>> {
  if (!filePath.endsWith('.json')) {
    throw new Error('Invalid file type');
  }

  const rawdata = await readFile(filePath, 'utf-8');
  return JSON.parse(rawdata);
}
