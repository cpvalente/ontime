import { OntimeEvent, PlayableEvent } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, createEvent } from 'ontime-utils';

import { ExtendedEntry, initRundownMetadata } from '../../../common/utils/rundownMetadata';
import {
  calculateTimelineLayout,
  computeScopedRundown,
  getElementPosition,
  getEndHour,
  getStartHour,
  getStatusLabel,
  getTimeToStart,
  getUpcomingEvents,
  makeTimelineSections,
} from '../timeline.utils';

function makeEvent(
  id: string,
  timeStart: number,
  duration: number,
  patch: Partial<Omit<OntimeEvent, 'skip'>> = {},
): ExtendedEntry<PlayableEvent> {
  const event = createEvent({ id, timeStart, duration, ...patch }, id);
  if (!event) throw new Error('Invalid event fixture');
  return { ...event, ...initRundownMetadata(null).metadata, skip: false };
}

describe('getElementPosition()', () => {
  const scheduleStart = 8 * MILLIS_PER_HOUR; // 8:00
  const scheduleEnd = 12 * MILLIS_PER_HOUR; // 12:00
  const containerWidth = 1000;

  it('calculates proportional positions correctly', () => {
    const eventStart = 9 * MILLIS_PER_HOUR; // 9:00
    const eventDuration = MILLIS_PER_HOUR; // 1 hour duration

    const result = getElementPosition(scheduleStart, scheduleEnd, eventStart, eventDuration, containerWidth);

    // In a 4-hour window (1000px), 1 hour should take up 250px
    // Event starts 1 hour after schedule start, so left should be 250px
    expect(result.left).toBe(250);
    expect(result.width).toBe(250);
  });

  it('calculates small durations correctly', () => {
    const eventStart = 9 * MILLIS_PER_HOUR;
    const eventDuration = MILLIS_PER_HOUR / 60; // 1 minute duration

    const result = getElementPosition(scheduleStart, scheduleEnd, eventStart, eventDuration, containerWidth);

    // In a 4-hour window, 1 minute should be proportionally small
    const expectedWidth = (eventDuration * containerWidth) / (scheduleEnd - scheduleStart);
    expect(result.width).toBe(expectedWidth);
  });

  it('handles events at schedule boundaries correctly', () => {
    // Event starts at schedule start
    const result1 = getElementPosition(scheduleStart, scheduleEnd, scheduleStart, MILLIS_PER_HOUR, containerWidth);
    expect(result1.left).toBe(0);
    expect(result1.width).toBe(250);

    // Event ends at schedule end
    const result2 = getElementPosition(
      scheduleStart,
      scheduleEnd,
      scheduleEnd - MILLIS_PER_HOUR,
      MILLIS_PER_HOUR,
      containerWidth,
    );
    expect(result2.left).toBe(750);
    expect(result2.width).toBe(250);
  });
});

describe('calculateTimelineLayout()', () => {
  const scheduleStart = 8 * MILLIS_PER_HOUR; // 8:00
  const scheduleEnd = 12 * MILLIS_PER_HOUR; // 12:00
  const containerWidth = 1000;
  const MIN_WIDTH = 50;

  it('returns original positions when no scaling is needed', () => {
    const events = [
      { start: 9 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR }, // 1-hour event
      { start: 10 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR }, // Another 1-hour event
    ];

    const result = calculateTimelineLayout(events, scheduleStart, scheduleEnd, containerWidth, true, MIN_WIDTH);

    expect(result.scale).toBe(1);
    expect(result.totalWidth).toBe(containerWidth);
    expect(result.positions[0].width).toBe(250); // 1 hour = 250px in a 1000px/4hr window
    expect(result.positions[1].width).toBe(250);
  });

  it('scales positions when events are smaller than minimum width', () => {
    const events = [
      { start: 9 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR / 60 }, // 1-minute event
      { start: 10 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR }, // 1-hour event
    ];

    const result = calculateTimelineLayout(events, scheduleStart, scheduleEnd, containerWidth, true, MIN_WIDTH);

    // Scale should be calculated to make the 1-minute event MIN_WIDTH
    const baseWidth = (events[0].duration * containerWidth) / (scheduleEnd - scheduleStart);
    const expectedScale = MIN_WIDTH / baseWidth;

    expect(result.scale).toBe(expectedScale);
    expect(result.positions[0].width).toBe(MIN_WIDTH);
    expect(result.totalWidth).toBe(containerWidth * expectedScale);
  });

  it('maintains relative proportions when scaling', () => {
    const events = [
      { start: 9 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR / 60 }, // 1-minute event
      { start: 10 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR }, // 1-hour event
    ];

    const result = calculateTimelineLayout(events, scheduleStart, scheduleEnd, containerWidth, true, MIN_WIDTH);

    // Ratio between 1 hour and 1 minute should be maintained
    expect(result.positions[1].width / result.positions[0].width).toBeCloseTo(60);
  });

  it('correctly positions events relative to each other after scaling', () => {
    const events = [
      { start: 9 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR / 60 }, // 1-minute at 9:00
      { start: 10 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR / 60 }, // 1-minute at 10:00
    ];

    const result = calculateTimelineLayout(events, scheduleStart, scheduleEnd, containerWidth, true, MIN_WIDTH);

    // Events should maintain their relative spacing after scaling
    const hourWidth = result.positions[1].left - result.positions[0].left;
    const scaledHourInTimeline = (containerWidth * result.scale) / 4; // 4 hours total
    expect(hourWidth).toBeCloseTo(scaledHourInTimeline);
  });

  it('handles overlapping events correctly', () => {
    const events = [
      { start: 9 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR * 2 }, // 2-hour event from 9:00 to 11:00
      { start: 10 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR }, // 1-hour event from 10:00 to 11:00
    ];

    const result = calculateTimelineLayout(events, scheduleStart, scheduleEnd, containerWidth, true, MIN_WIDTH);

    expect(result.positions[0].left).toBe(250); // Starts at 9:00
    expect(result.positions[0].width).toBe(500); // 2 hours wide
    expect(result.positions[1].left).toBe(500); // Starts at 10:00
    expect(result.positions[1].width).toBe(250); // 1 hour wide
  });

  it('handles empty events array', () => {
    const result = calculateTimelineLayout([], scheduleStart, scheduleEnd, containerWidth, true, MIN_WIDTH);

    expect(result.scale).toBe(1);
    expect(result.totalWidth).toBe(containerWidth);
    expect(result.positions).toEqual([]);
  });

  it('handles events at timeline boundaries', () => {
    const events = [
      { start: scheduleStart, duration: MILLIS_PER_HOUR }, // Event at start
      { start: scheduleEnd - MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR }, // Event at end
    ];

    const result = calculateTimelineLayout(events, scheduleStart, scheduleEnd, containerWidth, true, MIN_WIDTH);

    expect(result.positions[0].left).toBe(0);
    expect(result.positions[1].left).toBe(750);
    expect(result.positions[0].width).toBe(250);
    expect(result.positions[1].width).toBe(250);
  });
});

describe('getElementPosition() across midnight', () => {
  it('places events in a schedule which ends on the following day', () => {
    const scheduleStart = 22 * MILLIS_PER_HOUR;
    const scheduleEnd = 2 * MILLIS_PER_HOUR; // 02:00 next day, a 4 hour schedule
    const position = getElementPosition(scheduleStart, scheduleEnd, 23 * MILLIS_PER_HOUR, MILLIS_PER_HOUR, 400);
    expect(position).toStrictEqual({ left: 100, width: 100 });
  });
});

describe('timeline hours', () => {
  it('has a section for every hour touched by the schedule, and none past its end', () => {
    const sections = (start: number, end: number) => makeTimelineSections(getStartHour(start), getEndHour(end));

    expect(
      sections(8 * MILLIS_PER_HOUR + 45 * MILLIS_PER_MINUTE, 10 * MILLIS_PER_HOUR + 15 * MILLIS_PER_MINUTE),
    ).toStrictEqual([8, 9, 10]);
    expect(sections(8 * MILLIS_PER_HOUR, 10 * MILLIS_PER_HOUR)).toStrictEqual([8, 9]);
  });
});

describe('getStatusLabel()', () => {
  it('reports events which are running or finished', () => {
    expect(getStatusLabel(0, 'live')).toBe('live');
    expect(getStatusLabel(-1000, 'done')).toBe('done');
  });

  it('reports events which should have started but have not as pending', () => {
    expect(getStatusLabel(0, 'future')).toBe('pending');
    expect(getStatusLabel(-5000, 'future')).toBe('pending');
  });

  it('counts down to the start with seconds when it is close, and without when it is far', () => {
    expect(getStatusLabel(5 * MILLIS_PER_MINUTE + 30_000, 'future')).toBe('5m30s');
    expect(getStatusLabel(90 * MILLIS_PER_MINUTE + 30_000, 'future')).toBe('1h30m');
  });
});

describe('getTimeToStart()', () => {
  it('counts the time until the event starts, including its delay, and goes negative once it is due', () => {
    const now = 10 * MILLIS_PER_HOUR;
    const start = 11 * MILLIS_PER_HOUR;
    expect(getTimeToStart(now, start, 0, 0)).toBe(MILLIS_PER_HOUR);
    expect(getTimeToStart(now, start, 5 * MILLIS_PER_MINUTE, 0)).toBe(65 * MILLIS_PER_MINUTE);
    expect(getTimeToStart(12 * MILLIS_PER_HOUR, start, 0, 0)).toBe(-MILLIS_PER_HOUR);
  });
});

describe('getUpcomingEvents()', () => {
  const events = [makeEvent('a', 0, 1000), makeEvent('b', 1000, 1000), makeEvent('c', 2000, 1000)];

  it('offers the first events as upcoming when nothing is selected', () => {
    const { now, next, followedBy } = getUpcomingEvents(events, null);
    expect([now?.id ?? null, next?.id, followedBy?.id]).toStrictEqual([null, 'a', 'b']);
  });

  it('follows the selected event', () => {
    const { now, next, followedBy } = getUpcomingEvents(events, 'a');
    expect([now?.id, next?.id, followedBy?.id]).toStrictEqual(['a', 'b', 'c']);
  });

  it('has nothing after the last event', () => {
    const { now, next, followedBy } = getUpcomingEvents(events, 'c');
    expect(now?.id).toBe('c');
    expect(next).toBeNull();
    expect(followedBy).toBeNull();
  });

  it('returns nothing for an empty rundown', () => {
    expect(getUpcomingEvents([], 'a')).toStrictEqual({ now: null, next: null, followedBy: null });
  });
});

describe('computeScopedRundown()', () => {
  const hour = MILLIS_PER_HOUR;

  it('returns an empty schedule for an empty rundown', () => {
    expect(computeScopedRundown([], null, false)).toStrictEqual({ scopedRundown: [], firstStart: 0, totalDuration: 0 });
  });

  it('only schedules events which will play', () => {
    const rundown = [makeEvent('a', 9 * hour, hour), { ...makeEvent('skipped', 10 * hour, hour), skip: true }];
    const { scopedRundown } = computeScopedRundown(rundown, null, false);
    expect(scopedRundown.map((event) => event.id)).toStrictEqual(['a']);
  });

  it('adds up the duration of events which follow each other', () => {
    const rundown = [makeEvent('a', 9 * hour, hour), makeEvent('b', 10 * hour, 2 * hour)];
    expect(computeScopedRundown(rundown, null, false)).toMatchObject({ firstStart: 9 * hour, totalDuration: 3 * hour });
  });

  it('includes the gaps between events in the total duration', () => {
    const rundown = [makeEvent('a', 9 * hour, hour), makeEvent('b', 11 * hour, hour)];
    expect(computeScopedRundown(rundown, null, false).totalDuration).toBe(3 * hour);
  });

  it('counts only the time an overlapping event adds to the schedule', () => {
    const rundown = [makeEvent('a', 9 * hour, hour), makeEvent('b', 9 * hour + 30 * MILLIS_PER_MINUTE, hour)];
    expect(computeScopedRundown(rundown, null, false).totalDuration).toBe(hour + 30 * MILLIS_PER_MINUTE);
  });

  it('can hide events before the selected one', () => {
    const rundown = [makeEvent('a', 9 * hour, hour), makeEvent('b', 10 * hour, hour), makeEvent('c', 11 * hour, hour)];
    const result = computeScopedRundown(rundown, 'b', true);
    expect(result.scopedRundown.map((event) => event.id)).toStrictEqual(['b', 'c']);
    expect(result).toMatchObject({ firstStart: 10 * hour, totalDuration: 2 * hour });
  });

  it('keeps the whole rundown when asked to hide past events but nothing is selected', () => {
    const rundown = [makeEvent('a', 9 * hour, hour), makeEvent('b', 10 * hour, hour)];
    expect(computeScopedRundown(rundown, null, true).scopedRundown).toHaveLength(2);
  });
});
