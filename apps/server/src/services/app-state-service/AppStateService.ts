import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import { publicFiles } from '../../setup/index.js';
import { isTest } from '../../setup/environment.js';
import { isPath } from '../../utils/fileManagement.js';
import { shouldCrashDev } from '../../utils/development.js';

interface AppState {
  lastLoadedProject?: string;
  lastLoadedRundown?: string;
  showWelcomeDialog?: boolean;
}

const adapter = new JSONFile<AppState>(publicFiles.appState);
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

export async function getLastLoadedRundown(): Promise<string | undefined> {
  // in test environment, we want to start the demo project
  if (isTest) return 'default';

  await config.read();
  return config.data.lastLoadedRundown;
}

export async function setLastLoadedRundown(rundownKey: string): Promise<void> {
  if (isTest) return;

  config.data.lastLoadedRundown = rundownKey;
  await config.write();
}

export async function getShowWelcomeDialog(): Promise<boolean> {
  // in test environment, we do not want the dialog
  if (isTest) return false;

  await config.read();
  return config.data.showWelcomeDialog ?? true; // default to  true
}

export async function setShowWelcomeDialog(show: boolean): Promise<boolean> {
  config.data.showWelcomeDialog = show;
  await config.write();
  return show;
}
