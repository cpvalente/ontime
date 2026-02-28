/* eslint-disable @typescript-eslint/no-explicit-any */
import { Playback } from 'ontime-types';
import type { Instant } from 'ontime-types';
import { vi } from 'vitest';

import { restoreService } from '../restore.service.js';
import { RestorePoint } from '../restore.type.js';

const asInstant = (value: number): Instant => value as Instant;

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
        startEpoch: asInstant(1234),
        currentDay: 0,
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
        startEpoch: asInstant(1234),
        currentDay: null,
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
        startEpoch: asInstant(1234),
        currentDay: 0,
      };

      const mockWrite = vi.fn().mockResolvedValue(undefined);

      await restoreService.save(testData, mockWrite);
      expect(mockWrite).toHaveBeenCalledWith(testData);
    });

    it('writes updated data when values change', async () => {
      const firstData: RestorePoint = {
        playback: Playback.Play,
        selectedEventId: '2345',
        startedAt: 2345,
        addedTime: 2345,
        pausedAt: 2345,
        firstStart: 2345,
        startEpoch: asInstant(2345),
        currentDay: 0,
      };

      const updatedData: RestorePoint = {
        playback: Playback.Pause,
        selectedEventId: '3456',
        startedAt: 3456,
        addedTime: 3456,
        pausedAt: 3456,
        firstStart: 3456,
        startEpoch: asInstant(3456),
        currentDay: 1,
      };

      const mockWrite = vi.fn().mockResolvedValue(undefined);

      await restoreService.save(firstData, mockWrite);
      await restoreService.save(updatedData, mockWrite);

      expect(mockWrite).toHaveBeenCalledTimes(2);
      expect(mockWrite).toHaveBeenNthCalledWith(1, firstData);
      expect(mockWrite).toHaveBeenNthCalledWith(2, updatedData);
    });

    it('handles write failures gracefully', async () => {
      const testData: RestorePoint = {
        playback: Playback.Pause,
        selectedEventId: '5678',
        startedAt: 5678,
        addedTime: 5678,
        pausedAt: 5678,
        firstStart: 5678,
        startEpoch: asInstant(5678),
        currentDay: 0,
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
