import { ProjectFile } from 'ontime-types';

import { readdirSync, statSync } from 'fs';

export const getFileListFromFolder = (folderPath: string): Array<ProjectFile> => {
  const files = readdirSync(folderPath);
  return files.map((file) => {
    const filePath = `${folderPath}/${file}`;
    const stats = statSync(filePath);

    return {
      filename: file,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
    };
  });
};
