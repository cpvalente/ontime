import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import { publicFiles } from '../../setup/index.js';
import { isTest } from '../../setup/environment.js';
import { isPath } from '../../utils/fileManagement.js';
import { shouldCrashDev } from '../../utils/development.js';

interface AppState {
  projectName?: string;
  rundownId?: string;
  showWelcomeDialog?: boolean;
}

const adapter = new JSONFile<AppState>(publicFiles.appState);
const config = new Low<AppState>(adapter, {});

export async function isLastLoadedProject(projectName: string): Promise<boolean> {
  const lastLoaded = await getLastLoaded();
  return lastLoaded?.projectName === projectName;
}

export async function getLastLoaded(): Promise<Pick<AppState, 'projectName' | 'rundownId'> | undefined> {
  // in test environment, we want to start the demo project
  if (isTest) return;

  await config.read();
  return { projectName: config.data.projectName, rundownId: config.data.rundownId };
}

export async function setLastLoaded(projectName: string, rundownId?: string): Promise<void> {
  if (isTest) return;

  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: shouldCrashDev(isPath(projectName), 'setLastLoaded should not be called with a path');

  config.data.projectName = projectName;
  config.data.rundownId = rundownId;
  await config.write();
}

export async function setLastLoadedRundown(rundownKey: string): Promise<void> {
  if (isTest) return;

  config.data.rundownId = rundownKey;
  await config.write();
}

export async function getShowWelcomeDialog(restorePointExists: boolean): Promise<boolean> {
  // in test environment, we do not want the dialog
  if (isTest) return false;

  if (restorePointExists) return false;

  await config.read();
  return config.data.showWelcomeDialog ?? true; // default to  true
}

export async function setShowWelcomeDialog(show: boolean): Promise<boolean> {
  config.data.showWelcomeDialog = show;
  await config.write();
  return show;
}
