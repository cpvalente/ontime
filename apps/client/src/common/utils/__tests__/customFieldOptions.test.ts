import type { CustomField } from 'ontime-types';

import { makeOptionSelectItems } from '../customFieldOptions';

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

  test('offers none and the options in order', () => {
    expect(makeOptionSelectItems(field, 'Hold')).toEqual([
      { value: '', label: 'None' },
      { value: 'Ready', label: 'Ready' },
      { value: 'Hold', label: 'Hold' },
    ]);
  });

  test('keeps a value which is not an option as a disabled choice', () => {
    expect(makeOptionSelectItems(field, 'Imported').at(-1)).toEqual({
      value: 'Imported',
      label: 'Imported (not in list)',
      disabled: true,
    });
  });
});
