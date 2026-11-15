import type { CustomField } from 'ontime-types';

import { getOptionChanges, getOptionTint, makeOptionSelectItems } from '../customFieldOptions';

describe('makeOptionSelectItems()', () => {
  const field: Extract<CustomField, { type: 'option' }> = {
    key: 'Status',
    label: 'Status',
    colour: '',
    type: 'option',
    options: [
      { label: 'Ready', colour: '#0f0' },
      { label: 'Hold', colour: '' },
    ],
  };

  test('offers none and the options in order, with their colours', () => {
    expect(makeOptionSelectItems(field, 'Hold')).toEqual([
      { value: '', label: 'None', colour: '' },
      { value: 'Ready', label: 'Ready', colour: '#0f0' },
      { value: 'Hold', label: 'Hold', colour: '' },
    ]);
  });

  test('keeps a value which is not an option as a disabled choice', () => {
    expect(makeOptionSelectItems(field, 'Imported').at(-1)).toEqual({
      value: 'Imported',
      label: 'Imported (not in list)',
      disabled: true,
      colour: '',
    });
  });

  test('tints a value with its option colour, other values are not tinted', () => {
    expect(getOptionTint(field, 'Ready')).toEqual(expect.objectContaining({ backgroundColor: expect.any(String) }));
    expect(getOptionTint(field, 'Hold')).toBeUndefined();
    expect(getOptionTint(field, 'Imported')).toBeUndefined();
    expect(getOptionTint(field, '')).toBeUndefined();
  });
});

describe('getOptionChanges()', () => {
  const initialOptions = [
    { label: 'Ready', colour: '' },
    { label: 'Hold', colour: '' },
  ];

  test('swapping two labels renames both options, nothing is removed', () => {
    const rows = [
      { label: 'Hold', colour: '', original: 'Ready' },
      { label: 'Ready', colour: '', original: 'Hold' },
    ];
    expect(getOptionChanges(rows, initialOptions)).toMatchObject({
      renamed: { Ready: 'Hold', Hold: 'Ready' },
      removed: [],
    });
  });

  test('a cleared row removes its option instead of renaming it', () => {
    const rows = [
      { label: ' ', colour: '', original: 'Ready' },
      { label: 'Hold', colour: '', original: 'Hold' },
    ];
    expect(getOptionChanges(rows, initialOptions)).toEqual({
      options: [{ label: 'Hold', colour: '' }],
      renamed: {},
      removed: [initialOptions[0]],
    });
  });

  test('a new row with the label of a removed option keeps it', () => {
    const rows = [
      { label: 'Hold', colour: '', original: 'Hold' },
      { label: 'Ready ', colour: '', original: null },
    ];
    expect(getOptionChanges(rows, initialOptions)).toEqual({
      options: [
        { label: 'Hold', colour: '' },
        { label: 'Ready', colour: '' },
      ],
      renamed: {},
      removed: [],
    });
  });
});
