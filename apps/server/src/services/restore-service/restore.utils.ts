import type { Instant, TimeOfDay } from 'ontime-types';

import * as timeCore from '../../lib/time-core/timeCore.js';
import type { RuntimeState } from '../../stores/runtimeState.js';
import type { RestorePoint } from './restore.types.js';

/**
 * Captures the playback of the given rundown with its times as instants
 * The runtime keeps its times of day within the day before the moment it is saved
 */
export function makeRestorePoint(state: Readonly<RuntimeState>, rundownId: string, savedAt: Instant): RestorePoint {
  const { startedAt } = state.timer;
  const { pausedAt } = state._timer;
  return {
    rundownId,
    playback: state.timer.playback,
    selectedEventId: state.eventNow?.id ?? null,
    startedAt: startedAt === null ? null : timeCore.lastInstantAt(startedAt as TimeOfDay, savedAt),
    addedTime: state.timer.addedTime,
    pausedAt: pausedAt === null ? null : timeCore.lastInstantAt(pausedAt, savedAt),
    pausedDuration: state._timer.pausedDuration,
    startEpoch: state._startEpoch,
    currentDay: state.rundown.currentDay,
    offsetMode: state.offset.mode,
  };
}
