/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';

import { Playback } from 'ontime-types';

import { isRestorePoint, RestorePoint, RestoreService } from '../RestoreService.js';

describe('isRestorePoint()', () => {
  it('validates a well defined object', () => {
    let restorePoint = {
      playback: 'play',
      selectedEventId: '123',
      startedAt: 1,
      addedTime: 2,
      pausedAt: 3,
    };
    expect(isRestorePoint(restorePoint)).toBe(true);

    restorePoint = {
      playback: 'roll',
      selectedEventId: '123',
      startedAt: null,
      addedTime: null,
      pausedAt: null,
    };
    expect(isRestorePoint(restorePoint)).toBe(true);
  });

  describe('rejects a badly formatted file', () => {
    it('with invalid playback value', () => {
      const restorePoint = {
        playback: 'unknown',
        selectedEventId: '123',
        startedAt: null,
        addedTime: null,
        pausedAt: null,
      };
      expect(isRestorePoint(restorePoint)).toBe(false);
    });
    it('with missing playback value', () => {
      const restorePoint = {
        selectedEventId: '123',
        startedAt: null,
        addedTime: null,
        pausedAt: null,
      };
      expect(isRestorePoint(restorePoint)).toBe(false);
    });
    it('with incorrect value', () => {
      const restorePoint = {
        playback: 'roll',
        selectedEventId: '123',
        startedAt: 'testing',
        addedTime: null,
        pausedAt: null,
      };
      expect(isRestorePoint(restorePoint)).toBe(false);
    });
  });
});

describe('RestoreService()', () => {
  describe('load()', () => {
    it('loads working file with times', () => {
      const expected = {
        playback: Playback.Play,
        selectedEventId: 'da5b4',
        startedAt: 1234,
        addedTime: 5678,
        pausedAt: 9087,
      };

      const restoreService = new RestoreService('/path/to/restore/file');
      vi.spyOn<any, any>(restoreService, 'read').mockImplementation(() => JSON.stringify(expected));

      const testLoad = restoreService.load();
      expect(testLoad).toStrictEqual(expected);
    });

    it('loads working file without times', () => {
      const expected = {
        playback: Playback.Stop,
        selectedEventId: null,
        startedAt: null,
        addedTime: null,
        pausedAt: null,
      };

      const restoreService = new RestoreService('/path/to/restore/file');
      vi.spyOn<any, any>(restoreService, 'read').mockImplementation(() => JSON.stringify(expected));

      const testLoad = restoreService.load();
      expect(testLoad).toStrictEqual(expected);
    });

    it('does not load wrong play state', () => {
      const expected = {
        playback: 'does-not-exist',
        selectedEventId: 'da5b4',
        startedAt: 1234,
        addedTime: 1234,
        pausedAt: 1234,
      };

      const restoreService = new RestoreService('/path/to/restore/file');
      vi.spyOn<any, any>(restoreService, 'read').mockImplementation(() => JSON.stringify(expected));

      const testLoad = restoreService.load();
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
      };

      const restoreService = new RestoreService('/path/to/restore/file');
      const writeSpy = vi.spyOn<any, any>(restoreService, 'write').mockImplementation(() => undefined);
      await restoreService.save(testData);
      expect(writeSpy).toHaveBeenCalledWith(JSON.stringify(testData));
    });
  });
});
