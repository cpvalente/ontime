import { OffsetMode, Playback, SimpleDirection, SimplePlayback } from 'ontime-types';
import type { Instant } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import * as logger from '../../../api-data/logs/logs.service.js';
import type { AuxTimers } from '../../aux-timer-service/auxTimer.utils.js';
import type { RestorePoint, RuntimeRestore } from '../restore.types.js';

const stopped = {
  playback: SimplePlayback.Stop,
  direction: SimpleDirection.CountDown,
  duration: 1000,
  value: 1000,
  startedAt: null,
};
const auxTimers: AuxTimers = [{ ...stopped, playback: SimplePlayback.Start, startedAt: 1 }, stopped, stopped];

vi.mock('../../../api-data/logs/logs.service.js', () => ({
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}));

const loaded = vi.hoisted(() => ({ projectId: 'project' }));

vi.mock('../../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: () => ({ getProjectId: () => loaded.projectId }),
}));

let restoreService: (typeof import('../restore.service.js'))['restoreService'];

beforeEach(async () => {
  vi.clearAllMocks();
  loaded.projectId = 'project';
  vi.resetModules();
  ({ restoreService } = await import('../restore.service.js'));
});

const runtime: RuntimeRestore = {
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
};

const savedRuntime = { ...runtime, projectId: 'project' };

const restorePoint: RestorePoint = {
  runtime: savedRuntime,
  auxTimers,
  savedAt: Date.now() as Instant,
};

describe('restoreService', () => {
  it('loads a valid recovery point', async () => {
    expect(await restoreService.load(vi.fn().mockResolvedValue(restorePoint))).toStrictEqual(restorePoint);
  });

  it('ignores a recovery point saved more than 5 hours ago, the show is no longer running', async () => {
    const stalePoint = { ...restorePoint, savedAt: (Date.now() - 6 * MILLIS_PER_HOUR) as Instant };

    await expect(restoreService.load(vi.fn().mockResolvedValue(stalePoint))).resolves.toBeNull();
    expect(logger.info).toHaveBeenCalledWith('SERVER', 'Restore skipped', {
      reason: 'stale',
      savedAt: stalePoint.savedAt,
    });
  });

  it('loads nothing silently when there is no recovery point', async () => {
    await expect(restoreService.load(vi.fn().mockResolvedValue(null))).resolves.toBeNull();
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warning).not.toHaveBeenCalled();
  });

  it('ignores an invalid recovery file without crashing', async () => {
    await expect(restoreService.load(vi.fn().mockResolvedValue({ runtime: 1 }))).resolves.toBeNull();
    expect(logger.warning).toHaveBeenCalledWith('SERVER', 'Restore skipped', { reason: 'invalid-file' });
  });

  it('returns null when the recovery file cannot be read', async () => {
    await expect(restoreService.load(vi.fn().mockRejectedValue(new Error('Unexpected token')))).resolves.toBeNull();
    expect(logger.warning).toHaveBeenCalledWith('SERVER', 'Restore skipped', {
      reason: 'read-failed',
      error: 'Unexpected token',
    });
  });

  it('writes changed recovery points only', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const paused = { ...runtime, playback: Playback.Pause };

    await restoreService.save(runtime, write);
    await restoreService.save(runtime, write);
    await restoreService.save(paused, write);

    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenNthCalledWith(1, { runtime: savedRuntime, savedAt: expect.any(Number) });
    expect(write).toHaveBeenNthCalledWith(2, {
      runtime: { ...paused, projectId: 'project' },
      savedAt: expect.any(Number),
    });
  });

  it('saves aux timers with the runtime, neither replacing the other', async () => {
    const write = vi.fn().mockResolvedValue(undefined);

    // before playback changes, the point holds the aux timers only
    await restoreService.saveAuxTimers(auxTimers, write);
    expect(write).toHaveBeenLastCalledWith({ auxTimers, savedAt: expect.any(Number) });

    await restoreService.save(runtime, write);
    expect(write).toHaveBeenLastCalledWith({ runtime: savedRuntime, auxTimers, savedAt: expect.any(Number) });

    const stoppedTimers: AuxTimers = [stopped, stopped, stopped];
    await restoreService.saveAuxTimers(stoppedTimers, write);
    expect(write).toHaveBeenLastCalledWith({
      runtime: savedRuntime,
      auxTimers: stoppedTimers,
      savedAt: expect.any(Number),
    });
  });

  it('keeps the project the runtime was saved in when another project loads', async () => {
    const write = vi.fn().mockResolvedValue(undefined);

    await restoreService.save(runtime, write);
    loaded.projectId = 'another-project';
    await restoreService.saveAuxTimers(auxTimers, write);

    expect(write).toHaveBeenLastCalledWith({ runtime: savedRuntime, auxTimers, savedAt: expect.any(Number) });
  });

  it('saves a change back while the previous write is pending', async () => {
    let finishWrite = () => {};
    const write = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockImplementationOnce(() => new Promise<void>((resolve) => (finishWrite = resolve)))
      .mockResolvedValue(undefined);

    await restoreService.save(runtime, write);
    const pending = restoreService.save({ ...runtime, playback: Playback.Pause }, write);
    await restoreService.save(runtime, write);
    finishWrite();
    await pending;

    expect(write).toHaveBeenCalledTimes(3);
    expect(write).toHaveBeenLastCalledWith({ runtime: savedRuntime, savedAt: expect.any(Number) });
  });

  it('saves the same runtime again after another project loads', async () => {
    const write = vi.fn().mockResolvedValue(undefined);

    await restoreService.save(runtime, write);
    loaded.projectId = 'another-project';
    await restoreService.save(runtime, write);

    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenLastCalledWith(
      expect.objectContaining({ runtime: expect.objectContaining({ projectId: 'another-project' }) }),
    );
  });

  it('does not throw when saving fails', async () => {
    const write = vi.fn().mockRejectedValue(new Error('Write failed'));

    await expect(restoreService.save(runtime, write)).resolves.toBeUndefined();
    expect(write).toHaveBeenCalledOnce();
  });

  it('explains once that it stopped saving after repeated failures', async () => {
    const write = vi.fn().mockRejectedValue(new Error('Write failed'));

    for (let i = 0; i < 6; i++) {
      await restoreService.save({ ...runtime, selectedEventId: `failing-save-${i}` }, write);
    }

    expect(logger.warning).toHaveBeenCalledTimes(1);
    expect(logger.warning).toHaveBeenCalledWith('SERVER', 'Restore saving stopped', { error: 'Write failed' });
  });

  it('keeps a recovery point for the project it was saved in', () => {
    expect(restoreService.forProject(restorePoint, 'project')).toBe(restorePoint);
    expect(restoreService.forProject(null, 'project')).toBeNull();
  });

  it('skips the runtime saved in another project, and keeps its aux timers', () => {
    expect(restoreService.forProject(restorePoint, 'another-project')).toStrictEqual({
      ...restorePoint,
      runtime: undefined,
    });
    expect(logger.warning).toHaveBeenCalledWith('SERVER', 'Restore skipped', {
      reason: 'other-project',
      projectId: 'project',
    });
  });

  it('clears the recovery file and tolerates a failed clear', async () => {
    const write = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Clear failed'));

    await expect(restoreService.clear(write)).resolves.toBeUndefined();
    await expect(restoreService.clear(write)).resolves.toBeUndefined();
    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenCalledWith(null);
  });
});
