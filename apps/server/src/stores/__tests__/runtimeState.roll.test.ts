import { Instant, OntimeEntry, PlayableEvent, Playback, TimerPhase } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, createEvent, dayInMs } from 'ontime-utils';

import { makeOntimeDelay, makeRundown } from '../../api-data/rundown/__mocks__/rundown.mocks.js';
import { processRundown } from '../../api-data/rundown/rundown.dao.js';
import { clearState, getState, load, roll, update, updateRundownData } from '../runtimeState.js';

const minute = MILLIS_PER_MINUTE;
const hour = MILLIS_PER_HOUR;
const midnight = new Date(2026, 0, 1).getTime();

function at(clock: number) {
  const instant = (midnight + clock) as Instant;
  vi.setSystemTime(instant);
  return instant;
}

function event(id: string, timeStart: number, timeEnd: number): PlayableEvent {
  return createEvent({ id, timeStart, timeEnd }) as PlayableEvent;
}

function prepare(entries: OntimeEntry[]) {
  const input = makeRundown({
    entries: Object.fromEntries(entries.map((entry) => [entry.id, entry])),
    order: entries.map((entry) => entry.id),
  });
  const metadata = processRundown(input, {});
  const rundown = { ...input, entries: metadata.entries };
  updateRundownData(metadata);
  return { rundown, metadata };
}

beforeEach(() => {
  vi.useFakeTimers();
  at(0);
  clearState();
});

afterEach(() => {
  clearState();
  vi.useRealTimers();
});

describe('roll schedule', () => {
  test('joining mid-event shows the scheduled time remaining without adding a runtime delay', () => {
    const { rundown, metadata } = prepare([event('now', hour, 2 * hour)]);
    at(hour + 15 * minute);

    expect(roll(rundown, metadata)).toEqual({ eventId: 'now', didLoad: true, didStart: true });
    update();

    expect(getState()).toMatchObject({
      timer: { playback: Playback.Roll, startedAt: hour, current: 45 * minute, elapsed: 15 * minute },
      rundown: { actualStart: hour, currentDay: 0 },
      offset: { absolute: 0 },
    });
  });

  // Update this characterization when roll starts applying delay entries.
  test('an unapplied delay entry currently leaves playback on the original schedule', () => {
    const { rundown, metadata } = prepare([
      event('first', hour, 2 * hour),
      makeOntimeDelay({ duration: 10 * minute }),
      event('next', 2 * hour, 3 * hour),
    ]);
    at(2 * hour + 5 * minute);

    expect(roll(rundown, metadata)).toEqual({ eventId: 'next', didLoad: true, didStart: true });
    update();
    expect(getState().timer).toMatchObject({ startedAt: 2 * hour, current: 55 * minute });
  });
});

// `.fails` keeps known bugs executable; remove it with the corresponding fix.
describe('roll across midnight (edge cases for overnight shows)', () => {
  test('a midnight cue becomes due when the clock reaches its scheduled start', () => {
    const next = event('midnight', 0, hour);
    const { rundown, metadata } = prepare([next]);
    at(dayInMs - 100);
    load(next, rundown, metadata);
    roll(rundown, metadata);
    expect(getState().timer.secondaryTimer).toBe(100);

    expect(update(at(dayInMs))).toMatchObject({ hasSecondaryTimerFinished: true });
    expect(getState().timer.secondaryTimer).toBe(0);
  });

  test("joining at an overnight cue's end waits for its next scheduled start", () => {
    const { rundown, metadata } = prepare([event('overnight', 23 * hour, hour)]);
    at(hour);

    roll(rundown, metadata);

    expect(getState()).toMatchObject({
      eventNow: { id: 'overnight' },
      timer: { phase: TimerPhase.Pending, secondaryTimer: 22 * hour },
    });
  });

  test.fails('a late update just after midnight still marks the midnight cue as due', () => {
    const next = event('midnight', 0, hour);
    const { rundown, metadata } = prepare([next]);
    at(dayInMs - 100);
    load(next, rundown, metadata);
    roll(rundown, metadata);

    expect(update(at(dayInMs + 32))).toMatchObject({ hasSecondaryTimerFinished: true });
  });

  test.fails('joining a count-to-end event after midnight counts down to its end today', () => {
    const overnight = { ...event('overnight', 23 * hour, hour), countToEnd: true };
    const { rundown, metadata } = prepare([overnight]);
    at(30 * minute);

    roll(rundown, metadata);
    update();

    expect(getState().timer.current).toBe(30 * minute);
  });
});

describe('roll carrying a runtime delay', () => {
  test.fails('a five-minute delay stays in the pre-roll countdown as time passes', () => {
    const next = event('next', hour, 2 * hour);
    const { rundown, metadata } = prepare([next]);
    at(50 * minute);
    load(next, rundown, metadata);
    const offset = { ...getState().offset, absolute: 5 * minute, relative: 5 * minute };
    roll(rundown, metadata, offset);
    expect(getState().timer.secondaryTimer).toBe(15 * minute);

    update(at(51 * minute));
    expect(getState().timer.secondaryTimer).toBe(14 * minute);
  });

  test.fails('starting a delayed cue preserves its shifted finish time', () => {
    const next = event('next', hour, 2 * hour);
    const { rundown, metadata } = prepare([next]);
    at(hour + 10 * minute);
    load(next, rundown, metadata);
    const offset = { ...getState().offset, absolute: 5 * minute, relative: 5 * minute };

    roll(rundown, metadata, offset);
    update();

    expect(getState().timer.current).toBe(55 * minute);
    expect(getState().offset.absolute).toBe(5 * minute);
  });
});

describe('starting roll after the show has finished (edge cases for repeated rundowns)', () => {
  test.fails('a leading zero-duration placeholder is skipped when preparing the next show', () => {
    const { rundown, metadata } = prepare([event('zero', hour, hour), event('next', hour, 2 * hour)]);
    at(3 * hour);

    roll(rundown, metadata);

    expect(getState()).toMatchObject({
      eventNow: { id: 'next' },
      timer: { phase: TimerPhase.Pending, secondaryTimer: 22 * hour },
    });
  });

  test.fails('an opening cue marked as skipped stays unloaded when preparing the next show', () => {
    const skipped = { ...event('skipped', 0, hour), skip: true };
    const { rundown, metadata } = prepare([skipped, event('next', hour, 2 * hour)]);
    at(3 * hour);

    roll(rundown, metadata);

    expect(getState()).toMatchObject({
      eventNow: { id: 'next' },
      timer: { phase: TimerPhase.Pending, secondaryTimer: 22 * hour },
    });
  });
});
