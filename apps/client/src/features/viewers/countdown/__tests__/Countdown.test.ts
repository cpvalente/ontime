import { ViewExtendedTimer } from 'common/models/TimeManager.type';
import { OntimeEvent } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

import { fetchTimerData, sanitiseTitle, TimerMessage } from '../countdown.helpers';

describe('sanitiseTitle() function', () => {
  it('should return a title when valid', () => {
    const validTitles = ['Test', 'test', 'test000', '...', 'test0999', 'test%&'];

    for (const title of validTitles) {
      expect(sanitiseTitle(title)).toBe(title);
    }
  });

  it('should return {no title} when invalid', () => {
    const invalidTitles = ['', undefined, null];
    for (const title of invalidTitles) {
      expect(sanitiseTitle(title as unknown as string)).toBe('{no title}');
    }
  });
});

describe('fetchTimerData() function', () => {
  it('shows current timer if current is the one we follow', () => {
    const followId = 'testId';
    const currentMockValue = 13;
    const follow = { id: followId } as OntimeEvent;
    const time = { current: currentMockValue } as ViewExtendedTimer;

    const { message, timer } = fetchTimerData(time, follow, followId, 0);
    expect(message).toBe(TimerMessage.running);
    expect(timer).toBe(currentMockValue);
  });

  it('shows the countdown to an upcoming event', () => {
    const startMockValue = 10000;
    const timeNow = 1000;
    const follow = { id: 'anotherevent', timeStart: startMockValue } as OntimeEvent;
    const time = { clock: timeNow } as ViewExtendedTimer;

    const { message, timer } = fetchTimerData(time, follow, 'notthesameevent', 0);
    expect(message).toBe(TimerMessage.toStart);
    expect(timer).toBe(startMockValue - timeNow);
  });

  it('shows the timer of a scheduled event that hasnt started', () => {
    const startMockValue = 10000;
    const endMockValue = 20000;
    const timeNow = 15000;
    const followId = 'testId';
    const follow = { id: followId, timeStart: startMockValue, timeEnd: endMockValue } as OntimeEvent;
    const time = { clock: timeNow, current: endMockValue - startMockValue } as ViewExtendedTimer;

    const { message, timer } = fetchTimerData(time, follow, 'notthesameevent', 0);
    expect(message).toBe(TimerMessage.waiting);
    expect(timer).toBe(endMockValue - startMockValue);
  });

  it('shows the end time of a finished event', () => {
    const startMockValue = 10000;
    const endMockValue = 20000;
    const timeNow = 30000;
    const followId = 'testId';
    const follow = { id: followId, timeStart: startMockValue, timeEnd: endMockValue } as OntimeEvent;
    const time = { clock: timeNow, current: endMockValue - startMockValue } as ViewExtendedTimer;

    const { message, timer } = fetchTimerData(time, follow, 'notthesameevent', 0);
    expect(message).toBe(TimerMessage.ended);
    expect(timer).toBe(endMockValue);
  });

  it('handle an idle event that finishes after midnight', () => {
    const startMockValue = 10000;
    const endMockValue = 1000;
    const timeNow = 15000;
    const followId = 'testId';
    const follow = { id: followId, timeStart: startMockValue, timeEnd: endMockValue } as OntimeEvent;
    const time = { clock: timeNow, current: dayInMs + endMockValue - startMockValue } as ViewExtendedTimer;

    const { message, timer } = fetchTimerData(time, follow, 'notthesameevent', 0);
    expect(message).toBe(TimerMessage.waiting);
    expect(timer).toBe(dayInMs + endMockValue - startMockValue);
  });

  it('handle an current event that finishes after midnight', () => {
    const startMockValue = 10000;
    const endMockValue = 1000;
    const timeNow = 15000;
    const followId = 'testId';
    const follow = { id: followId, timeStart: startMockValue, timeEnd: endMockValue } as OntimeEvent;
    const time = { clock: timeNow, current: dayInMs + endMockValue - startMockValue } as ViewExtendedTimer;

    const { message, timer } = fetchTimerData(time, follow, followId, 0);
    expect(message).toBe(TimerMessage.running);
    expect(timer).toBe(dayInMs + endMockValue - startMockValue);
  });

  it('handle an event that finishes after midnight but hasnt started', () => {
    const startMockValue = 10000;
    const endMockValue = 1000;
    const timeNow = 2000;
    const followId = 'testId';
    const follow = { id: followId, timeStart: startMockValue, timeEnd: endMockValue } as OntimeEvent;
    const time = { clock: timeNow, current: dayInMs + endMockValue - startMockValue } as ViewExtendedTimer;

    const { message, timer } = fetchTimerData(time, follow, 'notthesameevent', 0);
    expect(message).toBe(TimerMessage.toStart);
    expect(timer).toBe(startMockValue - timeNow);
  });
});
