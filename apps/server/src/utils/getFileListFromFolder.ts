import { ProjectFile } from 'ontime-types';

import { getAppDataPath } from '../setup.js';

import { extname, join } from 'path';
import { readdir, stat } from 'fs/promises';

const getFilesFromFolder = async (folderPath: string) => {
  return await readdir(folderPath);
};

const filterProjectFiles = (files: Array<string>): Array<string> => {
  return files.filter((file) => {
    const ext = extname(file).toLowerCase();
    return ext === '.json';
  });
};

/**
 * Asynchronously retrieves and returns an array of project files from the 'uploads' folder.
 * Each file in the 'uploads' folder is checked, and only those with a '.json' extension are processed.
 * For each qualifying file, its metadata is retrieved, including filename, creation time, and last modification time.
 *
 * @returns {Promise<Array<ProjectFile>>} A promise that resolves to an array of ProjectFile objects,
 *                                        each representing a file in the 'uploads' folder with its metadata.
 *                                        The metadata includes the filename, creation time (createdAt),
 *                                        and last modification time (updatedAt) of each file.
 *
 * @throws {Error} Throws an error if there is an issue in reading the directory or fetching file statistics.
 */
export const getProjectFiles = async (): Promise<ProjectFile[]> => {
  const uploadsFolderPath = join(getAppDataPath(), 'uploads');

  try {
    const allFiles = await getFilesFromFolder(uploadsFolderPath);
    const filteredFiles = filterProjectFiles(allFiles);

    const projectFiles = [];
    for (const file of filteredFiles) {
      const filePath = join(uploadsFolderPath, file);
      const stats = await stat(filePath);

      projectFiles.push({
        filename: file.replace(/\.[^/.]+$/, ''),
        createdAt: stats.birthtime.toISOString(),
        updatedAt: stats.mtime.toISOString(),
      });
    }

    return projectFiles;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
