import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import { appStatePath, isTest } from '../../setup/index.js';
import { isPath } from '../../utils/fileManagement.js';
import { shouldCrashDev } from '../../utils/development.js';

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
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: shouldCrashDev(isPath(filename), 'setLastLoadedProject should not be called with a path');

  config.data.lastLoadedProject = filename;
  await config.write();
}
