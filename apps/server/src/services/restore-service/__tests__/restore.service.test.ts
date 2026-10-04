import { OffsetMode, Playback } from 'ontime-types';
import type { Instant } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { restoreService } from '../restore.service.js';
import type { RestorePoint } from '../restore.types.js';

const restorePoint: RestorePoint = {
  rundownId: 'rundown',
  playback: Playback.Play,
  selectedEventId: 'event',
  startedAt: 1234,
  addedTime: 0,
  pausedAt: null,
  firstStart: 1234,
  startEpoch: 1234 as Instant,
  currentDay: 0,
  offsetMode: OffsetMode.Relative,
  savedAt: Date.now() as Instant,
};

describe('restoreService', () => {
  it('loads a valid recovery point', async () => {
    expect(await restoreService.load(vi.fn().mockResolvedValue(restorePoint))).toStrictEqual(restorePoint);
  });

  it('ignores a recovery point saved more than 5 hours ago, the show is no longer running', async () => {
    const stalePoint = { ...restorePoint, savedAt: (Date.now() - 6 * MILLIS_PER_HOUR) as Instant };

    await expect(restoreService.load(vi.fn().mockResolvedValue(stalePoint))).resolves.toBeNull();
  });

  it('ignores an old recovery file without crashing', async () => {
    const { rundownId: _rundownId, offsetMode: _offsetMode, ...oldPoint } = restorePoint;

    await expect(restoreService.load(vi.fn().mockResolvedValue(oldPoint))).resolves.toBeNull();
  });

  it('returns null when the recovery file cannot be read', async () => {
    await expect(restoreService.load(vi.fn().mockRejectedValue(new Error('File not found')))).resolves.toBeNull();
  });

  it('writes changed recovery points only', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const firstPoint = { ...restorePoint, selectedEventId: 'save-event' };
    const updatedPoint = { ...firstPoint, playback: Playback.Pause };

    await restoreService.save(firstPoint, write);
    await restoreService.save(firstPoint, write);
    await restoreService.save(updatedPoint, write);

    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenNthCalledWith(1, { ...firstPoint, savedAt: expect.any(Number) });
    expect(write).toHaveBeenNthCalledWith(2, { ...updatedPoint, savedAt: expect.any(Number) });
  });

  it('does not throw when saving fails', async () => {
    const point = { ...restorePoint, selectedEventId: 'failed-save' };
    const write = vi.fn().mockRejectedValue(new Error('Write failed'));

    await expect(restoreService.save(point, write)).resolves.toBeUndefined();
    expect(write).toHaveBeenCalledWith({ ...point, savedAt: expect.any(Number) });
  });

  it('clears the recovery file and tolerates a failed clear', async () => {
    const write = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Clear failed'));

    await expect(restoreService.clear(write)).resolves.toBeUndefined();
    await expect(restoreService.clear(write)).resolves.toBeUndefined();
    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenCalledWith(null);
  });
});
