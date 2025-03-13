import { CustomFields } from 'ontime-types';

import { makeOptionsFromCustomFields } from '../constants';

describe('makeOptionsFromCustomFields', () => {
  const testCustomFields: CustomFields = {
    field1: { label: 'Field 1', colour: 'red', type: 'string' },
    field2: { label: 'Field 2', colour: 'blue', type: 'string' },
  };

  it('creates a record of keys for the given custom fields', () => {
    const result = makeOptionsFromCustomFields(testCustomFields);
    expect(result).toStrictEqual({
      'custom-field1': 'Custom: Field 1',
      'custom-field2': 'Custom: Field 2',
    });
  });

  it('appends additional data', () => {
    const additionalData = {
      test1: 'test1',
      test2: 'test2',
    };
    const result = makeOptionsFromCustomFields(testCustomFields, additionalData);
    expect(result).toStrictEqual({
      'custom-field1': 'Custom: Field 1',
      'custom-field2': 'Custom: Field 2',
      test1: 'test1',
      test2: 'test2',
    });
  });

  it('filtersImageTypes', () => {
    const customFieldsWIthImage: CustomFields = {
      ...testCustomFields,
      field3: { label: 'Field 3', colour: 'green', type: 'image' },
    };

    const result = makeOptionsFromCustomFields(customFieldsWIthImage);
    expect(result).toStrictEqual({
      'custom-field1': 'Custom: Field 1',
      'custom-field2': 'Custom: Field 2',
    });
  });
});
