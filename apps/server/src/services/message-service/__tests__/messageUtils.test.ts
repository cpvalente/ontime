import { validateMessage, validateTimerMessage } from '../messageUtils.js';

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
});
