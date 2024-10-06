import { dayInMs } from 'ontime-utils';

import { getElementPosition, makeTimelineSections } from '../timeline.utils';

describe('getCSSPosition()', () => {
  it('accounts for rundown with one event', () => {
    const scheduleStart = 0;
    const scheduleEnd = dayInMs;
    const eventStart = 0;
    const eventDuration = dayInMs;
    const containerWidth = 100;

    const result = getElementPosition(scheduleStart, scheduleEnd, eventStart, eventDuration, containerWidth);
    expect(result.left).toBe(0);
    expect(result.width).toBe(containerWidth);
  });

  it('accounts for an event that starts halfway and ends at end', () => {
    const scheduleStart = 0;
    const scheduleEnd = 100;
    const eventStart = 50;
    const eventDuration = 50;
    const containerWidth = 100;

    const result = getElementPosition(scheduleStart, scheduleEnd, eventStart, eventDuration, containerWidth);
    expect(result.left).toBe(50);
    expect(result.width).toBe(50);
  });

  it('accounts for an event that starts first and ends halfway', () => {
    const scheduleStart = 0;
    const scheduleEnd = 100;
    const eventStart = 0;
    const eventDuration = 50;
    const containerWidth = 100;

    const result = getElementPosition(scheduleStart, scheduleEnd, eventStart, eventDuration, containerWidth);
    expect(result.left).toBe(0);
    expect(result.width).toBe(50);
  });

  it('accounts for an event that is in the middle of the rundown', () => {
    const scheduleStart = 7;
    const scheduleEnd = 23;
    const eventStart = 10;
    const eventDuration = 1;
    const containerWidth = 1000;

    // 16 hour event, this gives 62.5px per hour
    const result = getElementPosition(scheduleStart, scheduleEnd, eventStart, eventDuration, containerWidth);
    expect(result.left).toBe(187.5); // 3 * 62.5
    expect(result.width).toBe(62.5);
  });
});

describe('makeTimelineSections', () => {
  it('creates an array between the hours given, end excluded', () => {
    const result = makeTimelineSections(11, 17);
    expect(result).toEqual([11, 12, 13, 14, 15, 16]);
  });
});
