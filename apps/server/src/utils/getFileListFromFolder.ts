import { ProjectFile } from 'ontime-types';

import { readdirSync, statSync } from 'fs';
import { extname } from 'path';

const getFilesFromFolder = (folderPath: string): Array<string> => {
  return readdirSync(folderPath);
};

const filterProjectFiles = (files: Array<string>): Array<string> => {
  return files.filter((file) => {
    const ext = extname(file).toLowerCase();
    return ext === '.json';
  });
};

export const getProjectFiles = (folderPath: string): Array<ProjectFile> => {
  const allFiles = getFilesFromFolder(folderPath);
  const filteredFiles = filterProjectFiles(allFiles);

  return filteredFiles.map((file) => {
    const filePath = `${folderPath}/${file}`;
    const stats = statSync(filePath);

    return {
      filename: file,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
    };
  });
};
