import type { CustomFields } from 'ontime-types';
import { describe, expect, test } from 'vitest';

import {
  sanitiseCustomFieldOptions,
  sortCustomFields,
  validateCustomFieldLabel,
  validateCustomFieldOptions,
} from './customFieldUtils.js';

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

describe('sanitiseCustomFieldOptions()', () => {
  test('keeps valid options in order, trimming labels and defaulting colours', () => {
    expect(
      sanitiseCustomFieldOptions([
        { label: ' Ready ', colour: '#0f0' },
        { label: 'Hold' },
        { label: 'ready', colour: '#f00' },
        { label: '  ' },
        'Cut',
        null,
        { label: 3 },
      ]),
    ).toEqual([
      { label: 'Ready', colour: '#0f0' },
      { label: 'Hold', colour: '' },
    ]);
  });

  test('gives an empty list for invalid data', () => {
    expect(sanitiseCustomFieldOptions(undefined)).toEqual([]);
    expect(sanitiseCustomFieldOptions('Ready')).toEqual([]);
  });
});

describe('validateCustomFieldOptions()', () => {
  test('accepts a list of distinct labels', () => {
    expect(
      validateCustomFieldOptions([
        { label: 'Ready', colour: '' },
        { label: 'Hold', colour: '' },
      ]),
    ).toBeNull();
  });

  test.each([
    [[], 'Add at least one option'],
    [
      [
        { label: 'Ready', colour: '' },
        { label: 'READY ', colour: '' },
      ],
      '"READY" is repeated',
    ],
    [[{ label: 'x'.repeat(101), colour: '' }], 'Options can be at most 100 characters'],
  ])('refuses %j', (options, error) => {
    expect(validateCustomFieldOptions(options)).toBe(error);
  });
});
