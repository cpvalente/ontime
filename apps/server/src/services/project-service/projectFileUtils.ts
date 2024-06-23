import { readFileSync } from 'fs';
import { extname } from 'path';

/**
 * Given an array of file names, filters out any files that do not have a '.json' extension.
 * We assume these are project files
 * @param files
 */
export function filterProjectFiles(files: Array<string>): Array<string> {
  return files.filter((file) => {
    const ext = extname(file).toLowerCase();
    return ext === '.json';
  });
}

/**
 * Parses a project file and returns the JSON object
 * @param filePath
 * @throws It will throw an error if it cannot read or parse the file
 */
export function parseProjectFile(filePath: string): object {
  if (!filePath.endsWith('.json')) {
    throw new Error('Invalid file type');
  }

  // we let the error bubble up to be handled in the consumer
  const rawdata = readFileSync(filePath, 'utf-8');
  const jsonData = JSON.parse(rawdata);

  return jsonData;
}
