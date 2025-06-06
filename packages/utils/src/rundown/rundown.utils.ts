import type { ProjectRundowns, Rundown } from 'ontime-types';

/**
 * Gets the first rundown in the project
 * We know that the project has at least one rundown
 */
export function getFirstRundown(rundowns: ProjectRundowns): Rundown {
  const keys = Object.keys(rundowns);
  if (keys.length === 0) {
    throw new Error('No rundowns found in project');
  }

  const firstKey = keys[0];
  return rundowns[firstKey];
}
