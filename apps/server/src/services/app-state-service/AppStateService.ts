import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import { appStatePath, isProduction, isTest } from '../../setup/index.js';
import { isPath } from '../../utils/fileManagement.js';
import { consoleError } from '../../utils/console.js';

interface AppState {
  lastLoadedProject?: string;
}

const adapter = new JSONFile<AppState>(appStatePath);
const config = new Low<AppState>(adapter, {});

export async function isLastLoadedProject(projectName: string): Promise<boolean> {
  const lastLoaded = await getLastLoadedProject();
  return lastLoaded === projectName;
}

export async function getLastLoadedProject(): Promise<string | undefined> {
  // in test environment, we want to start the demo project
  if (isTest) return;

  await config.read();
  return config.data.lastLoadedProject;
}

export async function setLastLoadedProject(filename: string): Promise<void> {
  if (isTest) return;
  if (!isProduction) {
    if (isPath(filename)) {
      consoleError(filename);
      consoleError(new Error('setLastLoadedProject should not be called with a path').stack);
      process.exit(0);
    }
  }

  config.data.lastLoadedProject = filename;
  await config.write();
}
