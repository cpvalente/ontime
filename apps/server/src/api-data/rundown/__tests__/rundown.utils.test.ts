import { assertType } from 'vitest';

import { createEvent } from '../rundown.utils.js';

describe('test event validator', () => {
  it('validates a good object', () => {
    const event = {
      title: 'test',
    };
    const validated = createEvent(event, 1);

    expect(validated).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        note: expect.any(String),
        timeStart: expect.any(Number),
        timeEnd: expect.any(Number),
        countToEnd: expect.any(Boolean),
        isPublic: expect.any(Boolean),
        skip: expect.any(Boolean),
        revision: expect.any(Number),
        type: expect.any(String),
        id: expect.any(String),
        cue: '2',
        colour: expect.any(String),
        custom: expect.any(Object),
      }),
    );
  });

  it('fails an empty object', () => {
    const event = {};
    const validated = createEvent(event, 1);
    expect(validated).toEqual(null);
  });

  it('makes objects strings', () => {
    const event = {
      title: 2,
      note: '1899-12-30T08:00:10.000Z',
    };
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const validated = createEvent(event, 1);
    if (validated === null) {
      throw new Error('unexpected value');
    }
    expect(typeof validated.title).toEqual('string');
    expect(typeof validated.note).toEqual('string');
  });

  it('enforces numbers on times', () => {
    const event = {
      timeStart: false,
      timeEnd: '2',
    };
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const validated = createEvent(event);
    if (validated === null) {
      throw new Error('unexpected value');
    }
    assertType<number>(validated.timeStart);
    assertType<number>(validated.timeEnd);
    assertType<number>(validated.duration);
    expect(validated.timeStart).toEqual(0);
    expect(validated.timeEnd).toEqual(2);
    expect(validated.duration).toEqual(2);
  });

  it('handles bad objects', () => {
    const event = {
      title: {},
    };
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const validated = createEvent(event);
    if (validated === null) {
      throw new Error('unexpected value');
    }
    expect(typeof validated.title).toEqual('string');
  });
});
