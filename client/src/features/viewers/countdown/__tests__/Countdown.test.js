import { DAY_TO_MS } from '../../../../../../server/src/classes/classUtils';
import { millisToSeconds } from '../../../../common/utils/dateConfig';
import { fetchTimerData, sanitiseTitle, timerMessages } from '../countdown.helpers';

describe('sanitiseTitle() function', () => {
  test('should return a title when valid', () => {
    const validTitles = ['Test', 'test', 'test000', '...', 'test0999', 'test%&'];

    for (const title of validTitles) {
      expect(sanitiseTitle(title)).toBe(title);
    }
  });

  test('should return {no title} when invalid', () => {
    const invalidTitles = ['', undefined, null];
    for (const title of invalidTitles) {
      expect(sanitiseTitle(title)).toBe('{no title}');
    }
  });
});

describe('fetchTimerData() function', () => {
  it('shows running timer if current is the one we follow', () => {
    const followId = 'testId';
    const runningMockValue = 13;
    const follow = { id: followId };
    const time = { running: runningMockValue };

    const { message, timer } = fetchTimerData(time, follow, followId);
    expect(message).toBe(timerMessages.running);
    expect(timer).toBe(runningMockValue);
  });

  it('shows the countdown to an upcoming event', () => {
    const startMockValue = 10000;
    const timeNow = 1000;
    const follow = { id: 'anotherevent', timeStart: startMockValue };
    const time = { clockMs: timeNow };

    const { message, timer } = fetchTimerData(time, follow, 'notthesameevent');
    expect(message).toBe(timerMessages.toStart);
    expect(timer).toBe(millisToSeconds(startMockValue - timeNow));
  });

  it('shows the timer of a scheduled event that hasnt started', () => {
    const startMockValue = 10000;
    const endMockValue = 20000;
    const timeNow = 15000;
    const followId = 'testId';
    const follow = { id: followId, timeStart: startMockValue, timeEnd: endMockValue };
    const time = { clockMs: timeNow, running: endMockValue - startMockValue };

    const { message, timer } = fetchTimerData(time, follow, 'notthesameevent');
    expect(message).toBe(timerMessages.waiting);
    expect(timer).toBe(endMockValue - startMockValue);
  });

  it('shows the end time of a finished event', () => {
    const startMockValue = 10000;
    const endMockValue = 20000;
    const timeNow = 30000;
    const followId = 'testId';
    const follow = { id: followId, timeStart: startMockValue, timeEnd: endMockValue };
    const time = { clockMs: timeNow, running: endMockValue - startMockValue };

    const { message, timer } = fetchTimerData(time, follow, 'notthesameevent');
    expect(message).toBe(timerMessages.ended);
    expect(timer).toBe(millisToSeconds(endMockValue));
  });

  it('handle an idle event that finishes after midnight', () => {
    const startMockValue = 10000;
    const endMockValue = 1000;
    const timeNow = 15000;
    const followId = 'testId';
    const follow = { id: followId, timeStart: startMockValue, timeEnd: endMockValue };
    const time = { clockMs: timeNow, running: DAY_TO_MS + endMockValue - startMockValue };

    const { message, timer } = fetchTimerData(time, follow, 'notthesameevent');
    expect(message).toBe(timerMessages.waiting);
    expect(timer).toBe(DAY_TO_MS + endMockValue - startMockValue);
  });

  it('handle an running event that finishes after midnight', () => {
    const startMockValue = 10000;
    const endMockValue = 1000;
    const timeNow = 15000;
    const followId = 'testId';
    const follow = { id: followId, timeStart: startMockValue, timeEnd: endMockValue };
    const time = { clockMs: timeNow, running: DAY_TO_MS + endMockValue - startMockValue };

    const { message, timer } = fetchTimerData(time, follow, followId);
    expect(message).toBe(timerMessages.running);
    expect(timer).toBe(DAY_TO_MS + endMockValue - startMockValue);
  });

  it('handle an event that finishes after midnight but hasnt started', () => {
    const startMockValue = 10000;
    const endMockValue = 1000;
    const timeNow = 2000;
    const followId = 'testId';
    const follow = { id: followId, timeStart: startMockValue, timeEnd: endMockValue };
    const time = { clockMs: timeNow, running: DAY_TO_MS + endMockValue - startMockValue };

    const { message, timer } = fetchTimerData(time, follow, 'notthesameevent');
    expect(message).toBe(timerMessages.toStart);
    expect(timer).toBe(millisToSeconds(startMockValue - timeNow));
  });
});
