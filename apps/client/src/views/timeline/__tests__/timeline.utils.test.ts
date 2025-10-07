import { MILLIS_PER_HOUR } from 'ontime-utils';

import { calculateTimelineLayout, getElementPosition } from '../timeline.utils';

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
