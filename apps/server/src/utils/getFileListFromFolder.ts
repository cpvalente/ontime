import { ProjectFile } from 'ontime-types';

import { readdirSync, statSync } from 'fs';

import { extname } from 'path';

interface Options {
  allowedExtensions?: Array<string>;
}

export const getFileListFromFolder = (folderPath: string, options: Options = {}): Array<ProjectFile> => {
  let files = readdirSync(folderPath);

  // Filter files if allowedExtensions is provided
  if (options.allowedExtensions && options.allowedExtensions.length > 0) {
    files = files.filter(file => {
      const ext = extname(file).toLowerCase();
      return options.allowedExtensions.includes(ext);
    });
  }
  
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
