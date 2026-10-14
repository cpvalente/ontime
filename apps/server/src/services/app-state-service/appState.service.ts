import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import { publicFiles } from '../../setup/index.js';
import { shouldCrashDev } from '../../utils/development.js';
import { isPath } from '../../utils/fileManagement.js';

interface AppState {
  projectName?: string;
  rundownId?: string;
  showWelcomeDialog?: boolean;
  serverPort?: number;
  /** false while a session runs, until it shuts down cleanly */
  sessionEndedCleanly?: boolean;
}

const adapter = new JSONFile<AppState>(publicFiles.appState);
const config = new Low<AppState>(adapter, {});

export async function isLastLoadedProject(projectName: string): Promise<boolean> {
  const lastLoaded = await getLastLoaded();
  return lastLoaded?.projectName === projectName;
}

export async function getLastLoaded(): Promise<Pick<AppState, 'projectName' | 'rundownId'> | undefined> {
  await config.read();
  return { projectName: config.data.projectName, rundownId: config.data.rundownId };
}

export async function setLastLoaded(projectName: string, rundownId?: string): Promise<void> {
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: shouldCrashDev(isPath(projectName), 'setLastLoaded should not be called with a path');

  config.data.projectName = projectName;
  config.data.rundownId = rundownId;
  await config.write();
}

export async function setLastLoadedRundown(rundownKey: string): Promise<void> {
  config.data.rundownId = rundownKey;
  await config.write();
}

export async function getShowWelcomeDialog(restorePointExists: boolean): Promise<boolean> {
  if (restorePointExists) return false;

  await config.read();
  return config.data.showWelcomeDialog ?? true; // default to  true
}

export async function setShowWelcomeDialog(show: boolean): Promise<boolean> {
  config.data.showWelcomeDialog = show;
  await config.write();
  return show;
}

/**
 * Marks this session as running, and tells whether the previous one ended cleanly
 * A session which crashed or lost power never ends cleanly
 */
export async function startSession(): Promise<boolean> {
  await config.read();
  const previousEndedCleanly = config.data.sessionEndedCleanly ?? true;
  config.data.sessionEndedCleanly = false;
  await config.write();
  return previousEndedCleanly;
}

/**
 * Records that this session ended cleanly, the next start reads it
 */
export async function endSession(): Promise<void> {
  config.data.sessionEndedCleanly = true;
  await config.write();
}

export async function getServerPort(): Promise<number | undefined> {
  await config.read();
  return config.data.serverPort;
}

export async function setServerPort(port: number): Promise<void> {
  config.data.serverPort = port;
  await config.write();
}
