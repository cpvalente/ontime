import { Playback } from 'ontime-types';

import { isRestorePoint } from '../restore.parser.js';
import { RestorePoint } from '../restore.type.js';

describe('isRestorePoint()', () => {
  it('validates a well defined object', () => {
    let restorePoint: RestorePoint = {
      playback: Playback.Roll,
      selectedEventId: '123',
      startedAt: 1,
      addedTime: 2,
      pausedAt: 3,
      firstStart: 1,
      startEpoch: 1,
    };
    expect(isRestorePoint(restorePoint)).toBe(true);

    restorePoint = {
      playback: Playback.Roll,
      selectedEventId: '123',
      startedAt: null,
      addedTime: 0,
      pausedAt: null,
      firstStart: 1,
      startEpoch: 1,
    };
    expect(isRestorePoint(restorePoint)).toBe(true);
  });

  describe('rejects a badly formatted file', () => {
    it('with invalid playback value', () => {
      const restorePoint = {
        playback: 'unknown',
        selectedEventId: '123',
        startedAt: null,
        addedTime: 0,
        pausedAt: null,
        groupStartAt: 10,
        startEpoch: 1,
      };
      expect(isRestorePoint(restorePoint)).toBe(false);
    });
    it('with missing playback value', () => {
      const restorePoint = {
        selectedEventId: '123',
        startedAt: null,
        addedTime: 0,
        pausedAt: null,
        groupStartAt: 10,
      };
      expect(isRestorePoint(restorePoint)).toBe(false);
    });
    it('with incorrect value', () => {
      const restorePoint = {
        playback: Playback.Roll,
        selectedEventId: '123',
        startedAt: 'testing',
        addedTime: 0,
        pausedAt: null,
        groupStartAt: 10,
        startEpoch: 1,
      };
      expect(isRestorePoint(restorePoint)).toBe(false);
    });
  });
});
