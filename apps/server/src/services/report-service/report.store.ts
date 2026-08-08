import { join } from 'path';

import { JSONFile } from 'lowdb/node';
import type { ProjectReports, ShowRun } from 'ontime-types';

import { publicDir } from '../../setup/index.js';
import { deleteFile, dockerSafeRename, ensureJsonExtension, statIfExists } from '../../utils/fileManagement.js';
import { isProjectReports } from './report.parser.js';

/**
 * Reports are kept in a sidecar file per project rather than in the project
 * itself. This keeps the project file free of mid-show writes and lets the
 * run history grow without bloating what the user exports.
 *
 * Persistence is best effort by design: a failing disk degrades reporting
 * but must never interrupt a running show.
 */

/**
 * Returns a fresh empty store.
 * Must not be a shared constant: `cache.runs` is mutated in place elsewhere
 * in this module, and a shared array would leak state between projects.
 */
function emptyStore(): ProjectReports {
  return { runs: [] };
}

let fileRef: JSONFile<ProjectReports> | null = null;
let cache: ProjectReports = emptyStore();
let failedWriteAttempts = 0;

/**
 * Resolves the sidecar path for a given project file name
 */
export function getPathToReports(projectFilename: string): string {
  return join(publicDir.reportsDir, ensureJsonExtension(projectFilename));
}

/**
 * Points the store at a project's sidecar and loads whatever is on disk.
 * Called on every project load, which is the single choke point for
 * project changes.
 */
export async function loadReports(projectFilename: string): Promise<ProjectReports> {
  fileRef = new JSONFile<ProjectReports>(getPathToReports(projectFilename));
  failedWriteAttempts = 0;

  try {
    const maybeReports = await fileRef.read();
    cache = isProjectReports(maybeReports) ? maybeReports : emptyStore();
  } catch (_error) {
    // a missing or corrupt sidecar is not worth interrupting a project load over
    cache = emptyStore();
  }

  return cache;
}

/**
 * Returns the runs held for the current project, newest first
 */
export function getRuns(): ShowRun[] {
  return cache.runs;
}

export function getRun(id: string): ShowRun | undefined {
  return cache.runs.find((run) => run.id === id);
}

/**
 * Inserts or replaces a run, keeping the list ordered newest first
 */
export async function upsertRun(run: ShowRun): Promise<void> {
  const index = cache.runs.findIndex((candidate) => candidate.id === run.id);
  if (index === -1) {
    cache.runs.unshift(run);
  } else {
    cache.runs[index] = run;
  }
  await persist();
}

/**
 * Deletes a single run, used to discard a test run from the history
 * @returns whether a run was found and removed
 */
export async function deleteRun(id: string): Promise<boolean> {
  const index = cache.runs.findIndex((run) => run.id === id);
  if (index === -1) {
    return false;
  }

  cache.runs.splice(index, 1);
  await persist();
  return true;
}

/**
 * Deletes every run belonging to a rundown, cascaded from rundown deletion
 * @returns how many runs were removed
 */
export async function deleteRunsForRundown(rundownId: string): Promise<number> {
  const before = cache.runs.length;
  cache.runs = cache.runs.filter((run) => run.rundownId !== rundownId);

  const removed = before - cache.runs.length;
  if (removed > 0) {
    await persist();
  }
  return removed;
}

/**
 * Clears the run history of the current project
 */
export async function deleteAllRuns(): Promise<void> {
  cache.runs = [];
  await persist();
}

/**
 * Removes a project's sidecar from disk.
 * Reports are owned by their project and do not outlive it.
 */
export async function deleteReportsForProject(projectFilename: string): Promise<void> {
  const path = getPathToReports(projectFilename);
  try {
    if ((await statIfExists(path)) !== null) {
      await deleteFile(path);
    }
  } catch (_error) {
    // a leftover sidecar is harmless, deleting the project must still succeed
  }
}

/**
 * Moves a project's sidecar so run history follows a project rename
 */
export async function renameReportsForProject(originalFilename: string, newFilename: string): Promise<void> {
  const originalPath = getPathToReports(originalFilename);
  const newPath = getPathToReports(newFilename);

  try {
    if ((await statIfExists(originalPath)) === null) {
      return;
    }
    await dockerSafeRename(originalPath, newPath);
    // keep the reference pointing at the file we just moved
    if (fileRef) {
      fileRef = new JSONFile<ProjectReports>(newPath);
    }
  } catch (_error) {
    // losing history on rename is bad but not fatal, the project rename stands
  }
}

/**
 * Writes the cache to disk.
 * Gives up after repeated failures so a broken disk cannot stall the runtime.
 * @private
 */
async function persist(): Promise<void> {
  if (fileRef === null || failedWriteAttempts > 3) {
    return;
  }

  try {
    await fileRef.write(cache);
    failedWriteAttempts = 0;
  } catch (_error) {
    failedWriteAttempts += 1;
  }
}

/**
 * Resets in-memory state, used when no project is loaded and in tests
 */
export function resetStore(): void {
  fileRef = null;
  cache = emptyStore();
  failedWriteAttempts = 0;
}
