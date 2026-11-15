import { CustomFields } from 'ontime-types';

import { parseCustomFields, sanitiseCustomFields } from '../customFields.parser.js';

describe('parseCustomFields()', () => {
  it('returns an empty list if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseCustomFields({}, errorEmitter);
    expect(result).toEqual([]);
    expect(errorEmitter).toHaveBeenCalledOnce();
  });

  it('parses data, skipping invalid results', () => {
    const errorEmitter = vi.fn();
    const customFields = [
      { key: 'test', label: 'test', type: 'text', colour: 'red' }, // ok
      { key: 'test', label: 'test', type: 'text', colour: 'blue' }, // repeated key
      { key: '3', label: '', type: 'text' }, // missing colour
      { key: '4', type: 'text', colour: '' }, // missing label
    ];

    const result = parseCustomFields({ customFields }, errorEmitter);
    expect(result).toStrictEqual([{ key: 'test', label: 'test', type: 'text', colour: 'red' }]);
    expect(errorEmitter).toHaveBeenCalled();
  });

  it.each([undefined, null, 'Notes', { Notes: { label: 'Notes', type: 'text', colour: '' } }])(
    'handles missing or invalid custom fields: %j',
    (customFields) => {
      const emitError = vi.fn();
      expect(parseCustomFields({ customFields }, emitError)).toEqual([]);
      expect(emitError).toHaveBeenCalledWith('No data found to import');
    },
  );
});

describe('sanitiseCustomFields()', () => {
  it('returns an empty list if there are no fields', () => {
    expect(sanitiseCustomFields([])).toEqual([]);
  });

  it('returns a list of valid entries, in the given order', () => {
    const customFields: CustomFields = [
      { key: 'test2', label: 'test2', type: 'text', colour: 'green' },
      { key: 'test', label: 'test', type: 'text', colour: 'red' },
      { key: 'Test3', label: 'Test3', type: 'text', colour: '' },
    ];
    expect(sanitiseCustomFields(customFields)).toStrictEqual(customFields);
  });

  it('type should be one of (image | string)', () => {
    const testTypes = sanitiseCustomFields([
      { key: 'test1', label: 'test1', type: 'another', colour: 'red' },
      { key: 'test2', label: 'test2', type: 'image', colour: 'red' },
      { key: 'test3', label: 'test3', type: 'text', colour: 'red' },
    ]);
    expect(testTypes).toStrictEqual([
      { key: 'test2', label: 'test2', type: 'image', colour: 'red' },
      { key: 'test3', label: 'test3', type: 'text', colour: 'red' },
    ]);
  });

  it('colour must be a string', () => {
    expect(sanitiseCustomFields([{ key: 'test', label: 'test', type: 'text', colour: 5 }])).toStrictEqual([]);
  });

  it('label can not be empty', () => {
    expect(sanitiseCustomFields([{ key: '', label: '', type: 'text', colour: 'red' }])).toStrictEqual([]);
  });

  it('a field without a key is dropped', () => {
    expect(sanitiseCustomFields([{ label: 'test', type: 'text', colour: 'red' }])).toStrictEqual([]);
  });

  it('remove extra stuff', () => {
    const customFields = [{ key: 'test', label: 'test', type: 'text', colour: 'red', extra: 'should be removed' }];
    expect(sanitiseCustomFields(customFields)).toStrictEqual([
      { key: 'test', label: 'test', type: 'text', colour: 'red' },
    ]);
  });

  it('drop incorrect name/key pairs', () => {
    const customFields: CustomFields = [
      { key: 'NewName', label: 'NewName', type: 'text', colour: 'red' },
      { key: 'willBeGone', label: 'BadName', type: 'text', colour: 'red' },
    ];
    expect(sanitiseCustomFields(customFields)).toStrictEqual([
      { key: 'NewName', label: 'NewName', type: 'text', colour: 'red' },
    ]);
  });

  it('labels with space', () => {
    const customFields: CustomFields = [
      { key: 'Test_with_Space', label: 'Test with Space', type: 'text', colour: 'red' },
    ];
    expect(sanitiseCustomFields(customFields)).toStrictEqual(customFields);
  });

  it('filters invalid entries', () => {
    const customFields = [
      { key: 'test', label: 'test', type: 'text', colour: 'red' },
      { key: 'test2', label: 'test2', type: 'text', colour: 'green' },
      { key: 'bad', label: '', type: 'text', colour: '' },
      'not a field',
      null,
      { key: 'Test3', label: 'Test3', type: 'text', colour: '' },
    ];
    expect(sanitiseCustomFields(customFields)).toStrictEqual([
      { key: 'test', label: 'test', type: 'text', colour: 'red' },
      { key: 'test2', label: 'test2', type: 'text', colour: 'green' },
      { key: 'Test3', label: 'Test3', type: 'text', colour: '' },
    ]);
  });

  it('drops repeated keys, keeping the first one in its position', () => {
    const customFields: CustomFields = [
      { key: 'Camera', label: 'Camera', type: 'text', colour: 'red' },
      { key: 'Notes', label: 'Notes', type: 'text', colour: '' },
      { key: 'Camera', label: 'Camera', type: 'image', colour: 'blue' },
    ];
    expect(sanitiseCustomFields(customFields)).toStrictEqual([customFields[0], customFields[1]]);
  });

  it('a numeric key keeps its position rather than moving first', () => {
    const customFields: CustomFields = [
      { key: 'Notes', label: 'Notes', type: 'text', colour: '' },
      { key: '2', label: '2', type: 'text', colour: '' },
    ];
    expect(sanitiseCustomFields(customFields).map((field) => field.key)).toEqual(['Notes', '2']);
  });
});

describe('reserved custom field keys', () => {
  it('drops fields whose key collides with Object prototype properties', () => {
    const customFields = [
      { key: 'toString', label: 'toString', type: 'text', colour: 'red' },
      { key: 'constructor', label: 'constructor', type: 'text', colour: 'red' },
      { key: 'normalField', label: 'normalField', type: 'text', colour: 'green' },
    ];
    expect(sanitiseCustomFields(customFields)).toStrictEqual([
      { key: 'normalField', label: 'normalField', type: 'text', colour: 'green' },
    ]);
  });
});
