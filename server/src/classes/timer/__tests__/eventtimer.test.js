import { EventTimer } from '../EventTimer';
import jest from 'jest-mock';

// necessary config
const timerConfig = { refresh: 1000 };

const mockSocket = {
  error: jest.fn(),
  send: jest.fn(),
  info: jest.fn(),
};

test('object instantiates correctly', async () => {
  const t = new EventTimer(mockSocket, timerConfig);

  // it contains everything from Timer
  expect(t.clock).toBeNull();
  expect(t.duration).toBeNull();
  expect(t.current).toBeNull();
  expect(t.timeTag).toBeNull();
  expect(t.secondaryTimer).toBeNull();
  expect(t._secondaryTarget).toBeNull();
  expect(t._finishAt).toBeNull();
  expect(t._finishedAt).toBeNull();
  expect(t._finishedFlag).toBeFalsy();
  expect(t._startedAt).toBeNull();
  expect(t._pausedAt).toBeNull();
  expect(t._pausedInterval).toBeNull();
  expect(t._pausedTotal).toBeNull();
  expect(t.state).toBe('stop');

  // and its own properties
  expect(t.ontimeCycle).toBe('idle');
  expect(t.prevCycle).toBeNull();
  expect(t.io).not.toBeNull();
  expect(t.osc).toBeNull();
  expect(t.http).toBeNull();
  expect(t._interval).not.toBeNull();

  const expectTitlesPublic = {
    titleNow: null,
    subtitleNow: null,
    presenterNow: null,
    titleNext: null,
    subtitleNext: null,
    presenterNext: null,
  };

  const expectTitles = {
    ...expectTitlesPublic,
    noteNow: null,
    noteNext: null,
  };

  expect(t.titlesPublic).toStrictEqual(expectTitlesPublic);
  expect(t.titles).toStrictEqual(expectTitles);

  expect(t.selectedEventIndex).toBeNull();
  expect(t.selectedEventId).toBeNull();
  expect(t.nextEventId).toBeNull();
  expect(t.selectedPublicEventId).toBeNull();
  expect(t.nextPublicEventId).toBeNull();

  t.shutdown();
});
