import { EndAction, SupportedEntry, TimeStrategy } from 'ontime-types';

import { createDelay, createEvent, createGroup, createMilestone, makeString } from './entryUtils.js';

describe('makeString()', () => {
  it('trims strings and stringifies primitives', () => {
    expect(makeString('  hello  ')).toBe('hello');
    expect(makeString(42)).toBe('42');
  });

  it('uses the fallback for missing values and objects', () => {
    expect(makeString(null, 'fallback')).toBe('fallback');
    expect(makeString(undefined)).toBe('');
    expect(makeString({ a: 1 }, 'fallback')).toBe('fallback');
  });
});

describe('createEvent()', () => {
  it('refuses to create an event from an empty patch', () => {
    expect(createEvent({})).toBeNull();
  });

  it('derives the cue from the position in the rundown, and accepts a custom cue', () => {
    expect(createEvent({ title: 'a' }, 0)?.cue).toBe('1');
    expect(createEvent({ title: 'a' }, 9)?.cue).toBe('10');
    expect(createEvent({ title: 'a' }, 'intro')?.cue).toBe('intro');
    expect(createEvent({ title: 'a', cue: 'Opening' }, 9)?.cue).toBe('Opening');
  });

  it('resolves timers from the fields provided and locks what the user set', () => {
    const lockedDuration = createEvent({ timeStart: 1000, duration: 5000 });
    expect(lockedDuration).toMatchObject({ timeStart: 1000, timeEnd: 6000, duration: 5000 });
    expect(lockedDuration?.timeStrategy).toBe(TimeStrategy.LockDuration);

    const lockedEnd = createEvent({ timeStart: 1000, timeEnd: 4000 });
    expect(lockedEnd).toMatchObject({
      timeStart: 1000,
      timeEnd: 4000,
      duration: 3000,
      timeStrategy: TimeStrategy.LockEnd,
    });
  });

  it('keeps the provided id and generates one when missing', () => {
    expect(createEvent({ id: 'mine', title: 'a' })?.id).toBe('mine');
    expect(createEvent({ title: 'a' })?.id).toBeTruthy();
  });

  it('cleans user text and falls back to defaults for invalid values', () => {
    const event = createEvent({ title: '  Opening  ', endAction: 'not-an-action' as EndAction, skip: 'yes' as never });
    expect(event).toMatchObject({ title: 'Opening', endAction: EndAction.None, skip: false });
  });

  it('keeps the custom field values provided', () => {
    expect(createEvent({ custom: { sponsor: 'ACME' } })?.custom).toStrictEqual({ sponsor: 'ACME' });
  });

  it('does not accept runtime metadata from the patch', () => {
    const event = createEvent({ title: 'a', parent: 'group', delay: 500, gap: 10, revision: 7 });
    expect(event).toMatchObject({ parent: null, delay: 0, gap: 0, revision: 0 });
  });
});

describe('createGroup()', () => {
  it('creates an empty group when no patch is given', () => {
    expect(createGroup()).toMatchObject({ type: SupportedEntry.Group, title: '', entries: [], targetDuration: null });
  });

  it('keeps user fields and resets runtime-calculated ones', () => {
    const group = createGroup({
      id: 'g1',
      title: 'Act 1',
      entries: ['a', 'b'],
      targetDuration: 60000,
      colour: ' red ',
      duration: 999,
      timeStart: 1,
      isFirstLinked: true,
      revision: 5,
    });
    expect(group).toMatchObject({
      id: 'g1',
      title: 'Act 1',
      entries: ['a', 'b'],
      targetDuration: 60000,
      colour: 'red',
      duration: 0,
      timeStart: null,
      timeEnd: null,
      isFirstLinked: false,
      revision: 0,
    });
  });
});

describe('createMilestone() and createDelay()', () => {
  it('preserves milestone user fields and group membership, but starts a new revision', () => {
    expect(
      createMilestone({
        id: 'doors',
        title: 'Doors',
        cue: 'M1',
        custom: { venue: 'Hall A' },
        parent: 'g1',
        revision: 5,
      }),
    ).toMatchObject({
      id: 'doors',
      type: SupportedEntry.Milestone,
      title: 'Doors',
      cue: 'M1',
      custom: { venue: 'Hall A' },
      parent: 'g1',
      revision: 0,
    });
  });

  it("preserves a delay's identity, duration and group membership", () => {
    expect(createDelay({ id: 'delay', duration: 5000, parent: 'g1' })).toStrictEqual({
      id: 'delay',
      type: SupportedEntry.Delay,
      duration: 5000,
      parent: 'g1',
    });
  });
});
