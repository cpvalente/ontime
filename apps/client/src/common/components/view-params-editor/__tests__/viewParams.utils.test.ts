import { CustomFields } from 'ontime-types';
import { describe, expect, it } from 'vitest';

import { OptionTitle } from '../constants';
import type { ViewOption } from '../viewParams.types';
import { getURLSearchParamsFromObj, makeOptionsFromCustomFields } from '../viewParams.utils';

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

describe('getURLSearchParamsFromObj', () => {
  // Mock view options for testing
  const mockViewOptions: ViewOption[] = [
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'color',
          title: 'Color',
          description: 'The color value',
          type: 'colour',
          defaultValue: 'ff0000',
        },
        {
          id: 'persist-field',
          title: 'Persistent Field',
          description: 'A field that persists',
          type: 'persist',
          values: ['persisted-value'],
        },
        {
          id: 'multi-select',
          title: 'Multi Select',
          description: 'A multi-select field',
          type: 'option',
          values: { value1: 'Value 1', value2: 'Value 2' },
          defaultValue: '',
        },
      ],
    },
  ];

  it('should handle empty params object', () => {
    const params = {};
    const result = getURLSearchParamsFromObj(params, mockViewOptions);

    // Should only include persisted values
    expect(result.get('persist-field')).toBe('persisted-value');
    expect(result.get('color')).toBeNull();
  });

  it('should not include values that match defaults', () => {
    const params = {
      color: 'ff0000', // same as the default
      'other-param': 'value',
    };
    const result = getURLSearchParamsFromObj(params, mockViewOptions);

    expect(result.get('color')).toBeNull();
    expect(result.get('other-param')).toBe('value');
  });

  it('should sanitize color values with #', () => {
    const params = {
      color: '#00ff00', // different from default and includes #
    };
    const result = getURLSearchParamsFromObj(params, mockViewOptions);

    expect(result.get('color')).toBe('00ff00');
  });

  it('should handle multi-select values', () => {
    const params = {
      'multi-select': 'value1,value2,value3',
    };
    const result = getURLSearchParamsFromObj(params, mockViewOptions);

    // Should have multiple entries for the same key
    const values = result.getAll('multi-select');
    expect(values).toEqual(['value1', 'value2', 'value3']);
  });

  it('should not include empty string values', () => {
    const params = {
      'empty-param': '',
    };
    const result = getURLSearchParamsFromObj(params, mockViewOptions);
    expect(result.get('empty-param')).toBeNull();
  });

  it('should allow multiple values for persisted fields', () => {
    const mockOptionsWithMultiPersist: ViewOption[] = [
      {
        title: OptionTitle.DataSources,
        collapsible: true,
        options: [
          {
            id: 'sub',
            title: 'Event subscription',
            description: 'The events to follow',
            values: [],
            type: 'persist',
          },
        ],
      },
    ];

    const params = {
      sub: 'value1,value2,value3',
    };
    const result = getURLSearchParamsFromObj(params, mockOptionsWithMultiPersist);
    const values = result.getAll('sub');

    expect(values).toStrictEqual(['value1', 'value2', 'value3']);
  });

  it('should allow adding multiple values for any field', () => {
    const params = {
      'regular-field': 'value1,value2,value3',
    };
    const result = getURLSearchParamsFromObj(params, mockViewOptions);

    const values = result.getAll('regular-field');
    expect(values).toHaveLength(3);
    expect(values).toEqual(['value1', 'value2', 'value3']);
  });

  it('should deduplicate repeated key-value pairs', () => {
    const params = {
      multiValue: 'value1,value1,value2,value2,value3',
      repeatedField: 'same,same,same',
    };

    const result = getURLSearchParamsFromObj(params, mockViewOptions);

    // Check multiValue field has unique values
    expect(result.getAll('multiValue')).toEqual(['value1', 'value2', 'value3']);

    // Check repeatedField has only one instance of the value
    expect(result.getAll('repeatedField')).toEqual(['same']);
  });

  it('should deduplicate persisted values while maintaining order', () => {
    const mockOptionsWithDuplicates: ViewOption[] = [
      {
        title: OptionTitle.StyleOverride,
        options: [
          {
            id: 'sub',
            title: 'Subscription',
            description: 'Persisted subscription values',
            type: 'persist',
            values: ['value1', 'value1', 'value2', 'value2', 'value3', 'value1'],
          },
        ],
      },
    ];

    const result = getURLSearchParamsFromObj({}, mockOptionsWithDuplicates);

    // Should only include unique values while maintaining order
    expect(result.getAll('sub')).toEqual(['value1', 'value2', 'value3']);
  });
});
