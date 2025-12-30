/* eslint-disable @typescript-eslint/no-explicit-any */
import { EpochMs, Playback } from 'ontime-types';

import { vi } from 'vitest';

import { RestorePoint } from '../restore.type.js';
import { restoreService } from '../restore.service.js';

describe('restoreService', () => {
  describe('load()', () => {
    it('loads working file with times', async () => {
      const expected: RestorePoint = {
        playback: Playback.Play,
        selectedEventId: 'da5b4',
        startedAt: 1234,
        addedTime: 5678,
        pausedAt: 9087,
        firstStart: 1234,
        startEpoch: 1234 as EpochMs,
      };

      const mockRead = vi.fn().mockResolvedValue(expected);

      const testLoad = await restoreService.load(mockRead);
      expect(testLoad).toStrictEqual(expected);
      expect(mockRead).toHaveBeenCalledOnce();
    });

    it('loads working file without times', async () => {
      const expected: RestorePoint = {
        playback: Playback.Stop,
        selectedEventId: null,
        startedAt: null,
        addedTime: 0,
        pausedAt: null,
        firstStart: 1234,
        startEpoch: 1234 as EpochMs,
      };

      const mockRead = vi.fn().mockResolvedValue(expected);

      const testLoad = await restoreService.load(mockRead);
      expect(testLoad).toStrictEqual(expected);
      expect(mockRead).toHaveBeenCalledOnce();
    });

    it('does not load wrong play state', async () => {
      const expected = {
        // Missing required field 'firstStart' to make validation fail
        playback: 'does-not-exist',
        selectedEventId: 'da5b4',
        startedAt: 1234,
        addedTime: 1234,
        pausedAt: 1234,
        groupStartAt: 10,
      };

      const mockRead = vi.fn().mockResolvedValue(expected);

      const testLoad = await restoreService.load(mockRead);
      // Should return null because isRestorePoint validation fails
      expect(testLoad).toBe(null);
      expect(mockRead).toHaveBeenCalledOnce();
    });

    it('returns null when file read fails', async () => {
      const mockRead = vi.fn().mockRejectedValue(new Error('File not found'));

      const testLoad = await restoreService.load(mockRead);
      expect(testLoad).toBe(null);
      expect(mockRead).toHaveBeenCalledOnce();
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
        startEpoch: 1234 as EpochMs,
      };

      const mockWrite = vi.fn().mockResolvedValue(undefined);

      await restoreService.save(testData, mockWrite);
      expect(mockWrite).toHaveBeenCalledWith(testData);
    });

    it('handles write failures gracefully', async () => {
      const testData: RestorePoint = {
        playback: Playback.Pause,
        selectedEventId: '5678',
        startedAt: 5678,
        addedTime: 5678,
        pausedAt: 5678,
        firstStart: 5678,
        startEpoch: 5678 as EpochMs,
      };

      const mockWrite = vi.fn().mockRejectedValue(new Error('Write failed'));

      // Should not throw, and should still call write
      await expect(restoreService.save(testData, mockWrite)).resolves.toBeUndefined();
      expect(mockWrite).toHaveBeenCalledWith(testData);
    });
  });

  describe('clear()', () => {
    it('clears the restore file', async () => {
      const mockWrite = vi.fn().mockResolvedValue(undefined);

      await restoreService.clear(mockWrite);
      expect(mockWrite).toHaveBeenCalledWith(null);
    });

    it('handles clear failures gracefully', async () => {
      const mockWrite = vi.fn().mockRejectedValue(new Error('Clear failed'));

      // Should not throw
      await expect(restoreService.clear(mockWrite)).resolves.toBeUndefined();
      expect(mockWrite).toHaveBeenCalledWith(null);
    });
  });
});
