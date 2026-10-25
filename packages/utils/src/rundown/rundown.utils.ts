import type { ProjectRundowns, Rundown } from 'ontime-types';

import { checkRegex } from '../regex-utils/checkRegex.js';

/**
 * Rundown names are used across user input, project files and API payloads.
 * Keep a single rule so every boundary accepts and rejects the same names.
 */
export const RUNDOWN_TITLE_MAX_LENGTH = 64;
export const RUNDOWN_TITLE_CHARACTER_ERROR = 'Title can only contain alphanumeric characters, spaces and underscores';
export const RUNDOWN_TITLE_LENGTH_ERROR = `Title must be ${RUNDOWN_TITLE_MAX_LENGTH} characters or fewer`;
export const RUNDOWN_TITLE_EMPTY_ERROR = 'Title cannot be empty';
export const DEFAULT_RUNDOWN_TITLE = 'untitled';

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

/**
 * Returns a user facing error when the title is invalid, or null when valid.
 * Names are alphanumeric with spaces and underscores, at most 64 characters and not empty.
 */
export function validateRundownTitle(title: string): string | null {
  if (title.trim().length === 0) return RUNDOWN_TITLE_EMPTY_ERROR;
  if (title.length > RUNDOWN_TITLE_MAX_LENGTH) return RUNDOWN_TITLE_LENGTH_ERROR;
  if (!checkRegex.isAlphanumericWithSpace(title)) return RUNDOWN_TITLE_CHARACTER_ERROR;
  return null;
}
