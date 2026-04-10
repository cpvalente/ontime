import { describe, expect, it } from 'vitest';

import { extractSheetId } from '../gsheetUtils';

describe('extractSheetId()', () => {
  it('extracts the ID from a full Google Sheets URL', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit#gid=0';
    expect(extractSheetId(url)).toBe('1aBcDeFgHiJkLmNoPqRsTuVwXyZ');
  });

  it('extracts the ID when the URL has no trailing path', () => {
    expect(extractSheetId('https://docs.google.com/spreadsheets/d/abc123')).toBe('abc123');
  });

  it('handles IDs with hyphens and underscores', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1a-B_c2/edit';
    expect(extractSheetId(url)).toBe('1a-B_c2');
  });

  it('returns a raw sheet ID unchanged', () => {
    expect(extractSheetId('1aBcDeFgHiJkLmNoPqRsTuVwXyZ')).toBe('1aBcDeFgHiJkLmNoPqRsTuVwXyZ');
  });

  it('trims whitespace from the input', () => {
    expect(extractSheetId('  1aBcDeFg  ')).toBe('1aBcDeFg');
  });

  it('trims whitespace from a pasted URL', () => {
    const url = '  https://docs.google.com/spreadsheets/d/1aBcDeFg/edit  ';
    expect(extractSheetId(url)).toBe('1aBcDeFg');
  });

  it('strips query params from a raw ID', () => {
    expect(extractSheetId('1aBcDeFgHiJkLmNoPqRsTuVwXyZ?edit=1')).toBe('1aBcDeFgHiJkLmNoPqRsTuVwXyZ');
  });

  it('strips fragment from a raw ID', () => {
    expect(extractSheetId('1aBcDeFg#gid=0')).toBe('1aBcDeFg');
  });

  it('returns empty string for empty input', () => {
    expect(extractSheetId('')).toBe('');
    expect(extractSheetId('   ')).toBe('');
  });
});
