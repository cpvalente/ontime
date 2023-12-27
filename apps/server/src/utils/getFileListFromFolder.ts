import { readdirSync } from 'fs';

export const getFileListFromFolder = (folderPath: string): Array<string> => {
  const files = readdirSync(folderPath);
  return files.map((file) => file.toString());
};
