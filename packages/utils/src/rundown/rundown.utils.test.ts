import { describe, expect, test } from 'vitest';

import {
  RUNDOWN_TITLE_CHARACTER_ERROR,
  RUNDOWN_TITLE_EMPTY_ERROR,
  RUNDOWN_TITLE_LENGTH_ERROR,
  RUNDOWN_TITLE_MAX_LENGTH,
  validateRundownTitle,
} from './rundown.utils.js';

describe('validateRundownTitle()', () => {
  test('accepts alphanumeric titles with spaces and underscores', () => {
    expect(validateRundownTitle('Morning Show')).toBeNull();
    expect(validateRundownTitle('Show 1')).toBeNull();
    expect(validateRundownTitle('show_one')).toBeNull();
  });

  test('rejects titles containing characters outside alphanumeric, space and underscore', () => {
    expect(validateRundownTitle('my-rundown')).toBe(RUNDOWN_TITLE_CHARACTER_ERROR);
    expect(validateRundownTitle('show #1')).toBe(RUNDOWN_TITLE_CHARACTER_ERROR);
    expect(validateRundownTitle('café')).toBe(RUNDOWN_TITLE_CHARACTER_ERROR);
  });

  test('rejects empty and whitespace only titles', () => {
    expect(validateRundownTitle('')).toBe(RUNDOWN_TITLE_EMPTY_ERROR);
    expect(validateRundownTitle('   ')).toBe(RUNDOWN_TITLE_EMPTY_ERROR);
  });

  test('rejects titles longer than the maximum length', () => {
    expect(validateRundownTitle('a'.repeat(RUNDOWN_TITLE_MAX_LENGTH + 1))).toBe(RUNDOWN_TITLE_LENGTH_ERROR);
  });

  test('accepts a title of exactly the maximum length', () => {
    expect(validateRundownTitle('a'.repeat(RUNDOWN_TITLE_MAX_LENGTH))).toBeNull();
  });
});
