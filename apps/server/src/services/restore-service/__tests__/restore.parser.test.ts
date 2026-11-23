import { OffsetMode, Playback, SimpleDirection, SimplePlayback } from 'ontime-types';
import type { Day, Duration, Instant, TimeOfDay } from 'ontime-types';

import { parseRestorePoint } from '../restore.parser.js';
import type { RestorePoint, RuntimeRestore } from '../restore.types.js';

const runtime: RuntimeRestore = {
  rundownId: 'rundown',
  playback: Playback.Play,
  selectedEventId: 'event',
  startedAt: 1 as Instant,
  pausedAt: null,
  pausedDuration: 0 as Duration,
  addedTime: 0 as Duration,
  startEpoch: 1 as Instant,
  startDayOffset: 0 as Day,
  startEventStart: 0 as TimeOfDay,
  startEventDay: 0 as Day,
  groupStartedAt: null,
  offsetMode: OffsetMode.Relative,
};

const running = {
  playback: SimplePlayback.Start,
  direction: SimpleDirection.CountDown,
  duration: 1000,
  value: 1000,
  startedAt: 1,
};
const stopped = { ...running, playback: SimplePlayback.Stop, startedAt: null };

const savedRuntime = { ...runtime, projectId: 'project' };

const restorePoint: RestorePoint = {
  runtime: savedRuntime,
  auxTimers: [running, stopped, stopped],
  savedAt: 1 as Instant,
};

describe('parseRestorePoint()', () => {
  it('reads a point with both parts, either part or none', () => {
    expect(parseRestorePoint(restorePoint)).toStrictEqual(restorePoint);
    expect(parseRestorePoint({ ...restorePoint, auxTimers: undefined })).toMatchObject({ runtime: savedRuntime });
    expect(parseRestorePoint({ ...restorePoint, runtime: undefined })).toMatchObject({ runtime: undefined });
    expect(parseRestorePoint({ savedAt: 1 })).toMatchObject({ savedAt: 1 });
  });

  it('accepts nullable stopped fields, a paused duration and a start anchor', () => {
    const stoppedRuntime = {
      ...savedRuntime,
      playback: Playback.Stop,
      selectedEventId: null,
      startedAt: null,
      startEpoch: null,
      startDayOffset: null,
      startEventStart: null,
      startEventDay: null,
      pausedDuration: 3000,
    };
    expect(parseRestorePoint({ ...restorePoint, runtime: stoppedRuntime })).not.toBeNull();
  });

  it('accepts a paused aux timer', () => {
    const paused = { ...running, playback: SimplePlayback.Pause, startedAt: null };
    expect(parseRestorePoint({ ...restorePoint, auxTimers: [paused, stopped, stopped] })).not.toBeNull();
  });

  it.each([
    ['no save time', { savedAt: undefined }],
    ['a runtime without a project id', { runtime }],
    ['an invalid project id', { runtime: { ...savedRuntime, projectId: 1 } }],
    ['an unknown playback', { runtime: { ...savedRuntime, playback: 'unknown' } }],
    ['an unknown offset mode', { runtime: { ...savedRuntime, offsetMode: 'unknown' } }],
    ['an invalid timer value', { runtime: { ...savedRuntime, startedAt: 'invalid' } }],
    ['a malformed paused duration', { runtime: { ...savedRuntime, pausedDuration: '3000' } }],
    ['a malformed start event', { runtime: { ...savedRuntime, startEventStart: '1' } }],
    ['a malformed start event day', { runtime: { ...savedRuntime, startEventDay: '1' } }],
    ['a malformed start day', { runtime: { ...savedRuntime, startDayOffset: '1' } }],
    ['a malformed group start', { runtime: { ...savedRuntime, groupStartedAt: '1' } }],
    ['a point without the timer base', { runtime: { ...savedRuntime, startDayOffset: undefined } }],
    ['a partial start anchor', { runtime: { ...savedRuntime, startDayOffset: null } }],
    ['two aux timers', { auxTimers: [running, stopped] }],
    ['a running aux timer without a start', { auxTimers: [running, stopped, { ...running, startedAt: null }] }],
    ['a paused aux timer still counting', { auxTimers: [running, stopped, { ...running, playback: 'pause' }] }],
    ['an aux timer without a value', { auxTimers: [running, stopped, { ...stopped, value: undefined }] }],
    ['an unknown direction', { auxTimers: [running, stopped, { ...running, direction: 'sideways' }] }],
  ])('rejects %s', (_description, patch) => {
    expect(parseRestorePoint({ ...restorePoint, ...patch })).toBeNull();
  });
});
