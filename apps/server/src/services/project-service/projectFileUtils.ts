import { readFileSync } from 'fs';
import { extname } from 'path';

/**
 * Given an array of file names, filters out any files that do not have a '.json' extension.
 * We assume these are project files
 * @param files
 * @returns
 */
export function filterProjectFiles(files: Array<string>): Array<string> {
  return files.filter((file) => {
    const ext = extname(file).toLowerCase();
    return ext === '.json';
  });
}

export function parseProjectFile(filePath: string): object {
  if (!filePath.endsWith('.json')) {
    throw new Error('Invalid file type');
  }

  const rawdata = readFileSync(filePath, 'utf-8');
  const uploadedJson = JSON.parse(rawdata);

  // at this point, we think this is a DatabaseModel
  // verify by looking for the required fields
  if (uploadedJson?.settings?.app !== 'ontime') {
    throw new Error('Not an Ontime project file');
  }
  return uploadedJson;
}
