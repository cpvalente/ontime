import { CustomFields } from 'ontime-types';

import { parseCustomFields, sanitiseCustomFields } from '../customFields.parser.js';

describe('parseCustomFields()', () => {
  it('returns an a base model if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseCustomFields({}, errorEmitter);
    expect(result).toBeTypeOf('object');
    expect(errorEmitter).toHaveBeenCalledOnce();
  });

  it('parses data, skipping invalid results', () => {
    const errorEmitter = vi.fn();
    // @ts-expect-error -- data is external, we check bad types
    const customFields = {
      1: { label: 'test', type: 'text', colour: 'red' }, // ok
      2: { label: 'test', type: 'text' }, // duplicate label
      3: { label: '', type: 'text' }, // missing colour
      4: { type: 'text', colour: '' }, // missing label
    } as CustomFields;

    const result = parseCustomFields({ customFields }, errorEmitter);
    expect(result).toMatchObject({
      test: {
        label: 'test',
        type: 'text',
        colour: 'red',
      },
    });
    expect(errorEmitter).toHaveBeenCalled();
  });
});

describe('sanitiseCustomFields()', () => {
  it('returns an empty object the type is incorrect', () => {
    expect(sanitiseCustomFields({})).toEqual({});
  });

  it('returns an object of valid entries', () => {
    const customFields: CustomFields = {
      test: { label: 'test', type: 'text', colour: 'red' },
      test2: { label: 'test2', type: 'text', colour: 'green' },
      Test3: { label: 'Test3', type: 'text', colour: '' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(customFields);
  });

  it('type should be one of (image | string)', () => {
    const testTypes = sanitiseCustomFields({
      test1: { label: 'test1', type: 'another', colour: 'red' },
      test2: { label: 'test2', type: 'image', colour: 'red' },
      test3: { label: 'test3', type: 'text', colour: 'red' },
    });
    expect(testTypes).toMatchObject({
      test2: { label: 'test2', type: 'image', colour: 'red' },
      test3: { label: 'test3', type: 'text', colour: 'red' },
    });
  });

  it('colour must be a string', () => {
    const customFields: CustomFields = {
      // @ts-expect-error intentional bad data
      test: { label: 'test', type: 'text', colour: 5 },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual({});
  });

  it('label can not be empty', () => {
    const customFields: CustomFields = {
      '': { label: '', type: 'text', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual({});
  });

  it('remove extra stuff', () => {
    const customFields: CustomFields = {
      // @ts-expect-error intentional bad data
      test: { label: 'test', type: 'text', colour: 'red', extra: 'should be removed' },
    };
    const expectedCustomFields: CustomFields = {
      test: { label: 'test', type: 'text', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });

  it('enforce name cohesion', () => {
    const customFields: CustomFields = {
      test: { label: 'NewName', type: 'text', colour: 'red' },
    };
    const expectedCustomFields: CustomFields = {
      NewName: { label: 'NewName', type: 'text', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });

  it('labels with space', () => {
    const customFields: CustomFields = {
      Test_with_Space: { label: 'Test with Space', type: 'text', colour: 'red' },
    };
    const expectedCustomFields: CustomFields = {
      Test_with_Space: { label: 'Test with Space', type: 'text', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });

  it('filters invalid entries', () => {
    const customFields: CustomFields = {
      test: { label: 'test', type: 'text', colour: 'red' },
      test2: { label: 'test2', type: 'text', colour: 'green' },
      bad: { label: '', type: 'text', colour: '' },
      Test3: { label: 'Test3', type: 'text', colour: '' },
    };
    const expectedCustomFields: CustomFields = {
      test: { label: 'test', type: 'text', colour: 'red' },
      test2: { label: 'test2', type: 'text', colour: 'green' },
      Test3: { label: 'Test3', type: 'text', colour: '' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });
});
