import { validateAnswer, validateMessage, validateQuestion, validateTimerMessage } from '../message.utils.js';

describe('validateMessage()', () => {
  it('returns a valid Message object', () => {
    expect(validateMessage('test')).toEqual('test');
  });
});

describe('validateAnswer()', () => {
  it('returns a valid answer value', () => {
    expect(validateAnswer('Yes')).toEqual('Yes');
  });

  it('caps the answer length', () => {
    const tooLong = 'a'.repeat(100);
    expect(validateAnswer(tooLong)).toHaveLength(40);
  });
});

describe('validateQuestion()', () => {
  it('returns a valid partial Question object', () => {
    const payload = {
      enabled: 'true',
      target: 'client-id',
      answers: ['Yes', 'No'],
      answer: 'Yes',
    };
    const expected = {
      enabled: true,
      target: 'client-id',
      answers: ['Yes', 'No'],
      answer: 'Yes',
    };

    expect(validateQuestion(payload)).toEqual(expected);
  });

  it('skips keys not given', () => {
    expect(validateQuestion({ enabled: 'true' })).toStrictEqual({ enabled: true });
  });

  it('allows a null target and answer', () => {
    expect(validateQuestion({ target: null, answer: null })).toEqual({ target: null, answer: null });
  });

  it('caps the number of answer options', () => {
    const payload = { answers: ['a', 'b', 'c', 'd', 'e'] };
    expect(validateQuestion(payload).answers).toHaveLength(3);
  });

  it('caps the length of each answer option', () => {
    const tooLong = 'a'.repeat(100);
    expect(validateQuestion({ answers: [tooLong] }).answers?.[0]).toHaveLength(40);
  });

  it('throws if the payload is not an object', () => {
    expect(() => validateQuestion('not an object')).toThrow();
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
