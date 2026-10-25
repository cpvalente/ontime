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

/** Returns a validation error, or null for a valid title. */
export function validateRundownTitle(title: string): string | null {
  if (title.trim().length === 0) return 'Title cannot be empty';
  if (title.length > 64) return 'Title must be 64 characters or fewer';
  if (!/[\p{L}\p{N}]/u.test(title)) return 'Title must contain at least one letter or number';
  return null;
}
