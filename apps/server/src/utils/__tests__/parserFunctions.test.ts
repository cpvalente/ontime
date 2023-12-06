import { HttpSubscription, HttpSubscriptionOptions, OscSubscription } from 'ontime-types';
import {
  validateOscSubscriptionObject,
  validateOscSubscriptionCycle,
  validateHttpSubscriptionCycle,
  validateHttpSubscriptionObject,
} from '../parserFunctions.js';

describe('validateOscSubscriptionCycle()', () => {
  it('should return false when given an OscSubscription with an invalid property value', () => {
    const invalidEntry = [{ message: 'test', enabled: 'not a boolean' }];

    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    const result = validateOscSubscriptionCycle(invalidEntry);
    expect(result).toBe(false);
  });
});

describe('validateOscSubscriptionObject()', () => {
  it('should return true when given a valid OscSubscription', () => {
    const validSubscription: OscSubscription = {
      onLoad: [{ message: 'test', enabled: true }],
      onStart: [{ message: 'test', enabled: false }],
      onPause: [{ message: 'test', enabled: true }],
      onStop: [{ message: 'test', enabled: false }],
      onUpdate: [{ message: 'test', enabled: true }],
      onFinish: [{ message: 'test', enabled: false }],
    };

    const result = validateOscSubscriptionObject(validSubscription);
    expect(result).toBe(true);
  });

  it('should return false when given undefined', () => {
    const result = validateOscSubscriptionObject(undefined);
    expect(result).toBe(false);
  });

  it('should return false when given null', () => {
    const result = validateOscSubscriptionObject(null);
    expect(result).toBe(false);
  });

  it('should return false when given an empty object', () => {
    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    const result = validateOscSubscriptionObject({});
    expect(result).toBe(false);
  });

  it('should return false when given an empty array', () => {
    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    const result = validateOscSubscriptionObject([]);
    expect(result).toBe(false);
  });

  it('should return false when given an object that is not an OscSubscription', () => {
    const invalidObject = { foo: 'bar' };

    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    const result = validateOscSubscriptionObject(invalidObject);
    expect(result).toBe(false);
  });

  it('should return false when given an OscSubscription with a missing property', () => {
    const invalidSubscription = {
      onLoad: [{ message: 'test', enabled: true }],
      onStart: [{ message: 'test', enabled: false }],
      onPause: [{ message: 'test', enabled: true }],
      // Missing onStop
      onUpdate: [{ message: 'test', enabled: true }],
      onFinish: [{ message: 'test', enabled: false }],
    };

    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    const result = validateOscSubscriptionObject(invalidSubscription);
    expect(result).toBe(false);
  });
});

describe('validateHttpSubscriptionCycle()', () => {
  it('should return false when given an HttpSubscription with an invalid property value', () => {
    const invalidBoolean = [{ url: 'http://', options: 'text=test', enabled: 'not a boolean', method: 'GET' }];
    const invalidHttp = [{ url: 'test', options: 'text=test', enabled: true, method: 'GET' }];
    const noFtp = [{ url: 'ftp://test', options: 'text=test', enabled: true, method: 'GET' }];
    const noEmpty = [{ url: '', options: 'text=test', enabled: true, method: 'GET' }];
    const invalidMethod = [{ url: '', options: 'text=test', enabled: true, method: 'GET' }];

    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    expect(validateHttpSubscriptionCycle(invalidBoolean)).toBe(false);
    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    expect(validateHttpSubscriptionCycle(invalidMethod)).toBe(false);
    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    expect(validateHttpSubscriptionCycle(invalidHttp)).toBe(false);
    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    expect(validateHttpSubscriptionCycle(noFtp)).toBe(false);
    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    expect(validateHttpSubscriptionCycle(noEmpty)).toBe(false);
  });
  it('should return true when given an HttpSubscription matches definition', () => {
    const validHttp: HttpSubscriptionOptions[] = [
      { url: 'http://', options: 'text=test', enabled: true, method: 'GET' },
      { url: 'http://', options: 'text=test', enabled: true, method: 'POST' },
    ];
    const validHttps: HttpSubscriptionOptions[] = [
      { url: 'https://', options: 'text=test', enabled: true, method: 'GET' },
      { url: 'https://', options: 'text=test', enabled: true, method: 'POST' },
    ];

    expect(validateHttpSubscriptionCycle(validHttp)).toBe(true);
    expect(validateHttpSubscriptionCycle(validHttps)).toBe(true);
  });
});

describe('validateHttpSubscriptionObject()', () => {
  it('should returnq true when given a valid HttpSubscription', () => {
    const validSubscription: HttpSubscription = {
      onLoad: [{ url: 'http://', options: 'text=test', enabled: true, method: 'GET' }],
      onStart: [{ url: 'http://', options: 'text=test', enabled: false, method: 'GET' }],
      onPause: [{ url: 'http://', options: 'text=test', enabled: true, method: 'GET' }],
      onStop: [{ url: 'http://', options: 'text=test', enabled: false, method: 'GET' }],
      onUpdate: [{ url: 'http://', options: 'text=test', enabled: true, method: 'GET' }],
      onFinish: [{ url: 'http://', options: 'text=test', enabled: false, method: 'GET' }],
    };

    const result = validateHttpSubscriptionObject(validSubscription);
    expect(result).toBe(true);
  });

  it('should return false when given undefined', () => {
    const result = validateHttpSubscriptionObject(undefined);
    expect(result).toBe(false);
  });

  it('should return false when given null', () => {
    const result = validateHttpSubscriptionObject(null);
    expect(result).toBe(false);
  });

  it('should return false when given an empty object', () => {
    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    const result = validateOscSubscriptionObject({});
    expect(result).toBe(false);
  });

  it('should return false when given an empty array', () => {
    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    const result = validateHttpSubscriptionObject([]);
    expect(result).toBe(false);
  });

  it('should return false when given an object that is not an HttpSubscription', () => {
    const invalidObject = { foo: 'bar' };

    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    const result = validateHttpSubscriptionObject(invalidObject);
    expect(result).toBe(false);
  });

  it('should return false when given an HttpSubscription with a missing property', () => {
    const invalidSubscription = {
      onLoad: [{ message: 'http://', enabled: true }],
      onStart: [{ message: 'http://', enabled: false }],
      onPause: [{ message: 'http://', enabled: true }],
      // Missing onStop
      onUpdate: [{ message: 'http://', enabled: true }],
      onFinish: [{ message: 'http://', enabled: false }],
    };

    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    const result = validateHttpSubscriptionObject(invalidSubscription);
    expect(result).toBe(false);
  });
});
