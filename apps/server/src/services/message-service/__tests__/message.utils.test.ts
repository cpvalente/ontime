import { validateMessage, validateTimerMessage } from '../message.utils.js';

describe('validateMessage()', () => {
  it('returns a valid Message object', () => {
    expect(validateMessage('test')).toEqual('test');
  });
});

describe('validateTimerMessage()', () => {
  it('returns a valid Timer Message object', () => {
    const payload = {
      text: '12312',
      visible: 'true',
      blink: 'true',
      blackout: 'true',
    };
    const expected = {
      text: '12312',
      visible: true,
      blink: true,
      blackout: true,
    };

    expect(validateTimerMessage(payload)).toEqual(expected);
  });
  it('skips keys not given', () => {
    const payload = {
      visible: 'true',
    };
    const expected = {
      visible: true,
    };

    expect(validateTimerMessage(payload)).toStrictEqual(expected);
  });
  it('coerces the secondary placement to a permitted value', () => {
    expect(validateTimerMessage({ secondaryPlacement: 'main' })).toStrictEqual({ secondaryPlacement: 'main' });
    expect(validateTimerMessage({ secondaryPlacement: 'below' })).toStrictEqual({ secondaryPlacement: 'below' });
  });
  it('falls back to below for an invalid placement', () => {
    expect(validateTimerMessage({ secondaryPlacement: 'nonsense' })).toStrictEqual({ secondaryPlacement: 'below' });
  });
});
