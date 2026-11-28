import { makeStageKey } from '../../../../../common/utils/localStorage';

// Matches the document ID segment from a Google Sheets URL:
// https://docs.google.com/spreadsheets/d/{ID}/edit#gid=0
//                                         ^^^^ captured group
// IDs consist of alphanumeric chars, hyphens, and underscores.
const sheetIdPattern = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
const lastSheetIdKey = makeStageKey('gsheet:lastSheetId');

/**
 * Extracts a Google Sheet ID from a full URL, or returns the raw input if it doesn't match.
 */
export function extractSheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(sheetIdPattern);
  if (match) return match[1];

  // Strip query params (?...) and fragments (#...) in case the user
  // pasted a partial URL or an ID with trailing junk like "abc123?edit=1"
  return trimmed.split(/[?#]/)[0];
}

export function getPersistedSheetId(): string {
  return localStorage.getItem(lastSheetIdKey) ?? '';
}

export function persistSheetId(sheetId: string) {
  localStorage.setItem(lastSheetIdKey, sheetId);
}
