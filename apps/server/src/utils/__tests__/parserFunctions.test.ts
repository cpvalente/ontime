import { CustomFields, HttpSubscription, OscSubscription } from 'ontime-types';
import { sanitiseCustomFields, sanitiseHttpSubscriptions, sanitiseOscSubscriptions } from '../parserFunctions.js';

describe('sanitiseOscSubscriptions()', () => {
  it('returns an empty array if not an array', () => {
    expect(sanitiseOscSubscriptions(undefined)).toEqual([]);
    // @ts-expect-error -- data is external, we check bad types
    expect(sanitiseOscSubscriptions({})).toEqual([]);
    expect(sanitiseOscSubscriptions(null)).toEqual([]);
  });

  it('returns an array of valid entries', () => {
    const oscSubscriptions: OscSubscription[] = [
      { id: '1', cycle: 'onLoad', address: '/test', payload: 'test', enabled: true },
      { id: '2', cycle: 'onStart', address: '/test', payload: 'test', enabled: false },
      { id: '3', cycle: 'onPause', address: '/test', payload: 'test', enabled: true },
      { id: '4', cycle: 'onStop', address: '/test', payload: 'test', enabled: false },
      { id: '5', cycle: 'onUpdate', address: '/test', payload: 'test', enabled: true },
      { id: '6', cycle: 'onFinish', address: '/test', payload: 'test', enabled: false },
    ];
    const sanitationResult = sanitiseOscSubscriptions(oscSubscriptions);
    expect(sanitationResult).toStrictEqual(oscSubscriptions);
  });

  it('filters invalid entries', () => {
    const oscSubscriptions = [
      { id: '1', cycle: 'onLoad', address: 4, payload: 'test', enabled: true },
      { cycle: 'onLoad', payload: 'test', enabled: true },
      { id: '2', cycle: 'unknown', payload: 'test', enabled: false },
      { id: '3', payload: 'test', enabled: true },
      { id: '4', cycle: 'onStop', enabled: false },
      { id: '5', cycle: 'onUpdate', payload: 'test' },
      { id: '6', cycle: 'onFinish', payload: 'test', enabled: 'true' },
    ];
    const sanitationResult = sanitiseOscSubscriptions(oscSubscriptions as OscSubscription[]);
    expect(sanitationResult.length).toBe(0);
  });
});

describe('sanitiseHttpSubscriptions()', () => {
  it('returns an empty array if not an array', () => {
    expect(sanitiseHttpSubscriptions(undefined)).toEqual([]);
    // @ts-expect-error -- data is external, we check bad types
    expect(sanitiseHttpSubscriptions({})).toEqual([]);
    expect(sanitiseHttpSubscriptions(null)).toEqual([]);
  });

  it('returns an array of valid entries', () => {
    const httpSubscription: HttpSubscription[] = [
      { id: '1', cycle: 'onLoad', message: 'http://test', enabled: true },
      { id: '2', cycle: 'onStart', message: 'http://test', enabled: false },
      { id: '3', cycle: 'onPause', message: 'http://test', enabled: true },
      { id: '4', cycle: 'onStop', message: 'http://test', enabled: false },
      { id: '5', cycle: 'onUpdate', message: 'http://test', enabled: true },
      { id: '6', cycle: 'onFinish', message: 'http://test', enabled: false },
    ];
    const sanitationResult = sanitiseHttpSubscriptions(httpSubscription);
    expect(sanitationResult).toStrictEqual(httpSubscription);
  });

  it('filters invalid entries', () => {
    const httpSubscription = [
      { cycle: 'onLoad', message: 'http://test', enabled: true },
      { id: '2', cycle: 'unknown', message: 'http://test', enabled: false },
      { id: '3', message: 'http://test', enabled: true },
      { id: '4', cycle: 'onStop', enabled: false },
      { id: '5', cycle: 'onUpdate', message: 'http://test' },
      { id: '6', cycle: 'onFinish', message: 'ftp://test', enabled: 'true' },
    ];
    const sanitationResult = sanitiseHttpSubscriptions(httpSubscription as HttpSubscription[]);
    expect(sanitationResult.length).toBe(0);
  });
});

describe('sanitiseCustomFields()', () => {
  it('returns an empty array if not an array', () => {
    expect(sanitiseCustomFields({})).toEqual({});
  });

  it('returns an object of valid entries', () => {
    const customFields: CustomFields = {
      test: { label: 'test', type: 'string', colour: 'red' },
      test2: { label: 'test2', type: 'string', colour: 'green' },
      test3: { label: 'Test3', type: 'string', colour: '' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(customFields);
  });

  it('type must match', () => {
    const customFields: CustomFields = {
      // @ts-expect-error intentional bad data
      test: { label: 'test', type: 'another', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual({});
  });

  it('colour must be a string', () => {
    const customFields: CustomFields = {
      // @ts-expect-error intentional bad data
      test: { label: 'test', type: 'string', colour: 5 },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual({});
  });

  it('label can not be empty', () => {
    const customFields: CustomFields = {
      ['']: { label: '', type: 'string', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual({});
  });

  it('remove extra stuff', () => {
    const customFields: CustomFields = {
      // @ts-expect-error intentional bad data
      test: { label: 'test', type: 'string', colour: 'red', extra: 'should be removed' },
    };
    const expectedCustomFields: CustomFields = {
      test: { label: 'test', type: 'string', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });

  it('enforece name coheation', () => {
    const customFields: CustomFields = {
      test: { label: 'different name', type: 'string', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual({});
  });

  it('filters invalid entries', () => {
    const customFields: CustomFields = {
      test: { label: 'test', type: 'string', colour: 'red' },
      test2: { label: 'test2', type: 'string', colour: 'green' },
      bad: { label: '', type: 'string', colour: '' },
      test3: { label: 'Test3', type: 'string', colour: '' },
    };
    const expectedCustomFields: CustomFields = {
      test: { label: 'test', type: 'string', colour: 'red' },
      test2: { label: 'test2', type: 'string', colour: 'green' },
      test3: { label: 'Test3', type: 'string', colour: '' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });
});
