import { validateOscSubscription } from '../parserFunctions.ts';

test('validateOscSubscription()', () => {
  it('should return true when given a valid OscSubscription', () => {
    const validSubscription = {
      onLoad: [{ id: '1', message: 'test', enabled: true }],
      onStart: [{ id: '2', message: 'test', enabled: false }],
      onPause: [{ id: '3', message: 'test', enabled: true }],
      onStop: [{ id: '4', message: 'test', enabled: false }],
      onUpdate: [{ id: '5', message: 'test', enabled: true }],
      onFinish: [{ id: '6', message: 'test', enabled: false }],
    };

    const result = validateOscSubscription(validSubscription);

    expect(result).toBe(true);
  });

  it('should return false when given undefined', () => {
    const result = validateOscSubscription(undefined);
    expect(result).toBe(false);
  });

  it('should return false when given null', () => {
    const result = validateOscSubscription(null);
    expect(result).toBe(false);
  });

  it('should return false when given an empty object', () => {
    const result = validateOscSubscription({});
    expect(result).toBe(false);
  });

  it('should return false when given an empty array', () => {
    const result = validateOscSubscription([]);
    expect(result).toBe(false);
  });

  it('should return false when given an object that is not an OscSubscription', () => {
    const invalidObject = { foo: 'bar' };

    const result = validateOscSubscription(invalidObject);

    expect(result).toBe(false);
  });

  it('should return false when given an OscSubscription with a missing property', () => {
    const invalidSubscription = {
      onLoad: [{ id: '1', message: 'test', enabled: true }],
      onStart: [{ id: '2', message: 'test', enabled: false }],
      onPause: [{ id: '3', message: 'test', enabled: true }],
      // Missing onStop
      onUpdate: [{ id: '5', message: 'test', enabled: true }],
      onFinish: [{ id: '6', message: 'test', enabled: false }],
    };

    const result = validateOscSubscription(invalidSubscription);

    expect(result).toBe(false);
  });

  it('should return false when given an OscSubscription with an invalid property value', () => {
    const invalidSubscription = {
      onLoad: [{ id: '1', message: 'test', enabled: true }],
      onStart: [{ id: '2', message: 'test', enabled: false }],
      onPause: [{ id: '3', message: 'test', enabled: true }],
      onStop: [{ id: '4', message: 'test', enabled: false }],
      onUpdate: [{ id: '5', message: 'test', enabled: true }],
      onFinish: [{ id: '6', message: 'test', enabled: 'not a boolean' }],
    };

    const result = validateOscSubscription(invalidSubscription);

    expect(result).toBe(false);
  });

  it('should return true if the message field is empty', () => {
    const invalidSubscription = {
      onLoad: [{ id: '1', message: 'test', enabled: true }],
      onStart: [{ id: '2', message: '', enabled: false }],
      onPause: [{ id: '3', message: '', enabled: true }],
      onStop: [{ id: '4', message: 'test', enabled: false }],
      onUpdate: [{ id: '5', message: 'test', enabled: true }],
      onFinish: [{ id: '6', message: 'test', enabled: 'not a boolean' }],
    };

    const result = validateOscSubscription(invalidSubscription);

    expect(result).toBe(true);
  });
});
