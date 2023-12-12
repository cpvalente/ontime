import { HttpSubscription, OscSubscription } from 'ontime-types';
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
    const invalidBoolean = [{ message: 'http://', enabled: 'not a boolean' }];
    const invalidHttp = [{ message: 'test', enabled: true }];
    const noFtp = [{ message: 'ftp://test', enabled: true }];
    const noEmpty = [{ message: '', enabled: true }];

    // @ts-expect-error -- since this comes from the client, we check things that typescript would have caught
    expect(validateHttpSubscriptionCycle(invalidBoolean)).toBe(false);

    expect(validateHttpSubscriptionCycle(invalidHttp)).toBe(false);
    expect(validateHttpSubscriptionCycle(noFtp)).toBe(false);
    expect(validateHttpSubscriptionCycle(noEmpty)).toBe(false);
  });
  it('should return true when given an HttpSubscription matches definition', () => {
    const validHttp = [{ message: 'http://', enabled: true }];
    const invalidHttps = [{ message: 'https://', enabled: true }];

    expect(validateHttpSubscriptionCycle(validHttp)).toBe(true);
    expect(validateHttpSubscriptionCycle(invalidHttps)).toBe(false);
  });
});

describe('validateHttpSubscriptionObject()', () => {
  it('should return true when given a valid HttpSubscription', () => {
    const validSubscription: HttpSubscription = {
      onLoad: [{ message: 'http://', enabled: true }],
      onStart: [{ message: 'http://', enabled: false }],
      onPause: [{ message: 'http://', enabled: true }],
      onStop: [{ message: 'http://', enabled: false }],
      onUpdate: [{ message: 'http://', enabled: true }],
      onFinish: [{ message: 'http://', enabled: false }],
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
