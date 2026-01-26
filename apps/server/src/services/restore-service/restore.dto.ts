import { runtimeState } from '../../stores/runtimeState.js';
import { RestorePoint } from './restore.type.js';

export function stateToRestore(state = runtimeState): RestorePoint {
  return {
    playback: state.timer.playback,
    selectedEventId: state.eventNow?.id ?? null,
    startedAt: state.timer.startedAt,
    addedTime: state.timer.addedTime,
    pausedAt: state._timer.pausedAt,
    firstStart: state.rundown.actualStart,
    startEpoch: state._startEpoch,
    currentDay: state.rundown.currentDay,
  };
}

export const restoreDTO = {
  stateToRestore,
};
