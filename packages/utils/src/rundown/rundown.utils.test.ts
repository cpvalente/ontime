import { describe, expect, test } from 'vitest';

import { validateRundownTitle } from './rundown.utils.js';

describe('validateRundownTitle()', () => {
  test.each(['Café — 東京 🎉', '2026', '١٢٣', 'e\u0301'])(
    'accepts a Unicode title containing a letter or number: %s',
    (title) => {
      expect(validateRundownTitle(title)).toBeNull();
    },
  );

  test.each(['-,._', '🎉', '\u0301'])('rejects a title without a letter or number: %s', (title) => {
    expect(validateRundownTitle(title)).toBe('Title must contain at least one letter or number');
  });

  test('rejects empty and whitespace only titles', () => {
    expect(validateRundownTitle('')).toBe('Title cannot be empty');
    expect(validateRundownTitle('   ')).toBe('Title cannot be empty');
  });

  test('enforces the maximum length', () => {
    expect(validateRundownTitle('a'.repeat(64))).toBeNull();
    expect(validateRundownTitle('a'.repeat(65))).toBe('Title must be 64 characters or fewer');
  });
});
