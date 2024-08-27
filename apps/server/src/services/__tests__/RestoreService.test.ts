/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';

import { Playback } from 'ontime-types';

import { isRestorePoint, RestorePoint, RestoreService } from '../RestoreService.js';

describe('isRestorePoint()', () => {
  it('validates a well defined object', () => {
    let restorePoint: RestorePoint = {
      playback: Playback.Roll,
      selectedEventId: '123',
      startedAt: 1,
      addedTime: 2,
      pausedAt: 3,
      firstStart: 1,
      blockStartAt: 10,
    };
    expect(isRestorePoint(restorePoint)).toBe(true);

    restorePoint = {
      playback: Playback.Roll,
      selectedEventId: '123',
      startedAt: null,
      addedTime: 0,
      pausedAt: null,
      firstStart: 1,
      blockStartAt: null,
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
        blockStartAt: 10,
      };
      expect(isRestorePoint(restorePoint)).toBe(false);
    });
    it('with missing playback value', () => {
      const restorePoint = {
        selectedEventId: '123',
        startedAt: null,
        addedTime: 0,
        pausedAt: null,
        blockStartAt: 10,
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
        blockStartAt: 10,
      };
      expect(isRestorePoint(restorePoint)).toBe(false);
    });
  });
});

describe('RestoreService()', () => {
  describe('load()', () => {
    it('loads working file with times', async () => {
      const expected: RestorePoint = {
        playback: Playback.Play,
        selectedEventId: 'da5b4',
        startedAt: 1234,
        addedTime: 5678,
        pausedAt: 9087,
        firstStart: 1234,
        blockStartAt: 1652,
      };

      const restoreService = new RestoreService('/path/to/restore/file');
      vi.spyOn<any, any>(restoreService, 'read').mockImplementation(() => expected);

      const testLoad = await restoreService.load();
      expect(testLoad).toStrictEqual(expected);
    });

    it('loads working file without times', async () => {
      const expected: RestorePoint = {
        playback: Playback.Stop,
        selectedEventId: null,
        startedAt: null,
        addedTime: 0,
        pausedAt: null,
        firstStart: 1234,
        blockStartAt: null,
      };

      const restoreService = new RestoreService('/path/to/restore/file');
      vi.spyOn<any, any>(restoreService, 'read').mockImplementation(() => expected);

      const testLoad = await restoreService.load();
      expect(testLoad).toStrictEqual(expected);
    });

    it('does not load wrong play state', async () => {
      const expected = {
        playback: 'does-not-exist',
        selectedEventId: 'da5b4',
        startedAt: 1234,
        addedTime: 1234,
        pausedAt: 1234,
        firstStart: 1234,
        blockStartAt: 10,
      };

      const restoreService = new RestoreService('/path/to/restore/file');
      vi.spyOn<any, any>(restoreService, 'read').mockImplementation(() => expected);

      const testLoad = await restoreService.load();
      expect(testLoad).toBe(null);
    });
  });

  describe('save()', () => {
    it('saves data to file', async () => {
      const testData: RestorePoint = {
        playback: Playback.Play,
        selectedEventId: '1234',
        startedAt: 1234,
        addedTime: 1234,
        pausedAt: 1234,
        firstStart: 1234,
        blockStartAt: null,
      };

      const restoreService = new RestoreService('/path/to/restore/file');
      const writeSpy = vi.spyOn<any, any>(restoreService, 'write').mockImplementation(() => undefined);
      await restoreService.save(testData);
      expect(writeSpy).toHaveBeenCalledWith(testData);
    });
  });
});
