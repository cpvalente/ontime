import { OffsetMode, Playback, SimpleDirection, SimplePlayback } from 'ontime-types';
import type { Instant } from 'ontime-types';

import { parseRestorePoint } from '../restore.parser.js';
import type { RestorePoint, RuntimeRestore } from '../restore.types.js';

const runtime: RuntimeRestore = {
  rundownId: 'rundown',
  playback: Playback.Play,
  selectedEventId: 'event',
  startedAt: 1,
  addedTime: 0,
  pausedAt: null,
  firstStart: 1,
  startEpoch: 1 as Instant,
  currentDay: 0,
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

  it('accepts nullable stopped fields and a paused duration', () => {
    const stoppedRuntime = {
      ...savedRuntime,
      playback: Playback.Stop,
      selectedEventId: null,
      startedAt: null,
      firstStart: null,
      startEpoch: null,
      currentDay: null,
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
    ['two aux timers', { auxTimers: [running, stopped] }],
    ['a running aux timer without a start', { auxTimers: [running, stopped, { ...running, startedAt: null }] }],
    ['a paused aux timer still counting', { auxTimers: [running, stopped, { ...running, playback: 'pause' }] }],
    ['an aux timer without a value', { auxTimers: [running, stopped, { ...stopped, value: undefined }] }],
    ['an unknown direction', { auxTimers: [running, stopped, { ...running, direction: 'sideways' }] }],
  ])('rejects %s', (_description, patch) => {
    expect(parseRestorePoint({ ...restorePoint, ...patch })).toBeNull();
  });
});
