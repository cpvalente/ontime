import type { ProjectRundowns, Rundown } from 'ontime-types';

/**
 * Gets the first rundown in the project
 * We know that the project has at least one rundown
 */
export function getFirstRundown(rundowns: ProjectRundowns): Rundown {
  const firstKey = Object.keys(rundowns)[0];

  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (!firstKey) {
      throw new Error('rundownUtils.getFirstRundown() No rundowns found');
    }
  }

  return rundowns[firstKey];
}
