import { OffsetMode, Playback } from 'ontime-types';
import type { Instant } from 'ontime-types';

import { isRestorePoint } from '../restore.parser.js';
import type { RestorePoint } from '../restore.types.js';

const restorePoint: RestorePoint = {
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

describe('isRestorePoint()', () => {
  it('accepts a saved playback point and nullable stopped fields', () => {
    expect(isRestorePoint(restorePoint)).toBe(true);
    expect(
      isRestorePoint({
        ...restorePoint,
        playback: Playback.Stop,
        selectedEventId: null,
        startedAt: null,
        firstStart: null,
        startEpoch: null,
        currentDay: null,
      }),
    ).toBe(true);
  });

  it('accepts a numeric paused duration but rejects a malformed one', () => {
    expect(isRestorePoint({ ...restorePoint, pausedDuration: 3000 })).toBe(true);
    expect(isRestorePoint({ ...restorePoint, pausedDuration: '3000' })).toBe(false);
  });

  it.each([
    ['unknown playback', { playback: 'unknown' }],
    ['unknown offset mode', { offsetMode: 'unknown' }],
    ['invalid timer value', { startedAt: 'invalid' }],
  ])('rejects %s', (_description, patch) => {
    expect(isRestorePoint({ ...restorePoint, ...patch })).toBe(false);
  });
});
