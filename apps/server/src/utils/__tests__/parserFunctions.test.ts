import { HttpSubscription, OscSubscription } from 'ontime-types';
import { sanitiseOscSubscriptions, sanitiseHttpSubscriptions } from '../parserFunctions.js';

describe('sanitiseOscSubscriptions()', () => {
  it('returns an empty array if not an array', () => {
    expect(sanitiseOscSubscriptions(undefined)).toEqual([]);
    // @ts-expect-error -- data is external, we check bad types
    expect(sanitiseOscSubscriptions({})).toEqual([]);
    expect(sanitiseOscSubscriptions(null)).toEqual([]);
  });

  it('returns an array of valid entries', () => {
    const oscSubscriptions: OscSubscription[] = [
      { id: '1', cycle: 'onLoad', message: 'test', enabled: true },
      { id: '2', cycle: 'onStart', message: 'test', enabled: false },
      { id: '3', cycle: 'onPause', message: 'test', enabled: true },
      { id: '4', cycle: 'onStop', message: 'test', enabled: false },
      { id: '5', cycle: 'onUpdate', message: 'test', enabled: true },
      { id: '6', cycle: 'onFinish', message: 'test', enabled: false },
    ];
    const sanitationResult = sanitiseOscSubscriptions(oscSubscriptions);
    expect(sanitationResult).toStrictEqual(oscSubscriptions);
  });

  it('filters invalid entries', () => {
    const oscSubscriptions = [
      { cycle: 'onLoad', message: 'test', enabled: true },
      { id: '2', cycle: 'unknown', message: 'test', enabled: false },
      { id: '3', message: 'test', enabled: true },
      { id: '4', cycle: 'onStop', enabled: false },
      { id: '5', cycle: 'onUpdate', message: 'test' },
      { id: '6', cycle: 'onFinish', message: 'test', enabled: 'true' },
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
    const oscSubscriptions: OscSubscription[] = [
      { id: '1', cycle: 'onLoad', message: 'http://test', enabled: true },
      { id: '2', cycle: 'onStart', message: 'http://test', enabled: false },
      { id: '3', cycle: 'onPause', message: 'http://test', enabled: true },
      { id: '4', cycle: 'onStop', message: 'http://test', enabled: false },
      { id: '5', cycle: 'onUpdate', message: 'http://test', enabled: true },
      { id: '6', cycle: 'onFinish', message: 'http://test', enabled: false },
    ];
    const sanitationResult = sanitiseHttpSubscriptions(oscSubscriptions);
    expect(sanitationResult).toStrictEqual(oscSubscriptions);
  });

  it('filters invalid entries', () => {
    const oscSubscriptions = [
      { cycle: 'onLoad', message: 'http://test', enabled: true },
      { id: '2', cycle: 'unknown', message: 'http://test', enabled: false },
      { id: '3', message: 'http://test', enabled: true },
      { id: '4', cycle: 'onStop', enabled: false },
      { id: '5', cycle: 'onUpdate', message: 'http://test' },
      { id: '6', cycle: 'onFinish', message: 'ftp://test', enabled: 'true' },
    ];
    const sanitationResult = sanitiseHttpSubscriptions(oscSubscriptions as HttpSubscription[]);
    expect(sanitationResult.length).toBe(0);
  });
});
