import type { CustomFields } from 'ontime-types';

import { makeCustomField } from '../../rundown/__mocks__/rundown.mocks.js';
import { mergeCustomFieldList } from '../customFields.utils.js';

describe('mergeCustomFieldList()', () => {
  const existing: CustomFields = [makeCustomField({ label: 'First' }), makeCustomField({ label: 'Second' })];

  test('a field with an existing key replaces it in its position, new fields are appended in order', () => {
    const merged = mergeCustomFieldList(existing, [
      makeCustomField({ label: 'Zeta' }),
      makeCustomField({ label: 'First', colour: 'red' }),
      makeCustomField({ label: '5' }),
    ]);

    expect(merged.map((field) => field.key)).toEqual(['First', 'Second', 'Zeta', '5']);
    expect(merged[0].colour).toBe('red');
  });

  test('does not change the given lists', () => {
    const incoming = [makeCustomField({ label: 'First', colour: 'red' })];
    const before = structuredClone({ existing, incoming });

    mergeCustomFieldList(existing, incoming);

    expect({ existing, incoming }).toStrictEqual(before);
  });
});
