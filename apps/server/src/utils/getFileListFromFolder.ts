import { ProjectFile } from 'ontime-types';
import { getAppDataPath } from '../setup.js';

import { readdirSync, statSync } from 'fs';
import { extname, join } from 'path';

const getFilesFromFolder = (folderPath: string): Array<string> => {
  return readdirSync(folderPath);
};

const filterProjectFiles = (files: Array<string>): Array<string> => {
  return files.filter((file) => {
    const ext = extname(file).toLowerCase();
    return ext === '.json';
  });
};

export const getProjectFiles = (): Array<ProjectFile> => {
  const uploadsFolderPath = join(getAppDataPath(), 'uploads');

  const allFiles = getFilesFromFolder(uploadsFolderPath);
  const filteredFiles = filterProjectFiles(allFiles);

  return filteredFiles.map((file) => {
    const filePath = `${uploadsFolderPath}/${file}`;
    const stats = statSync(filePath);

    return {
      filename: file,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
    };
  });
};
