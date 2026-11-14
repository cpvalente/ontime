import type { CustomFields } from 'ontime-types';
import { describe, expect, test } from 'vitest';

import { sortCustomFields, validateCustomFieldLabel } from './customFieldUtils.js';

describe('validateCustomFieldLabel()', () => {
  test.each(['Camera', 'Camera Angle', ' Song 2 ', 'snake_case'])('accepts %j', (label) => {
    expect(validateCustomFieldLabel(label)).toBeNull();
  });

  test.each([
    ['', 'Label cannot be empty'],
    ['   ', 'Label cannot be empty'],
    ['Camera/GFX', 'Label can only contain letters, numbers, spaces and underscores'],
    ['Café', 'Label can only contain letters, numbers, spaces and underscores'],
    ['constructor', '"constructor" is a reserved name'],
    ['__proto__', '"__proto__" is a reserved name'],
  ])('refuses %j', (label, error) => {
    expect(validateCustomFieldLabel(label)).toBe(error);
  });
});

describe('sortCustomFields()', () => {
  const fields: CustomFields = ['First', '2', 'Third'].map((key) => ({ key, label: key, type: 'text', colour: '' }));
  const keys = (list: CustomFields) => list.map((field) => field.key);

  test('sorts by the given keys, fields left out keep their relative order at the end', () => {
    expect(keys(sortCustomFields(fields, ['Third']))).toEqual(['Third', 'First', '2']);
  });

  test('does not change the given list', () => {
    sortCustomFields(fields, ['Third', '2', 'First']);
    expect(keys(fields)).toEqual(['First', '2', 'Third']);
  });
});
