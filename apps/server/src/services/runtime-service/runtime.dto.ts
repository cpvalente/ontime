import { EndAction, Maybe, Offset, Playback, TimerPhase } from 'ontime-types';
import { runtimeState } from '../../stores/runtimeState.js';
import { RuntimeServiceState } from './runtime.service.js';

function stateToBroadcastResult(state = runtimeState): RuntimeServiceState {
  return {
    timer: { ...state.timer },
    offset: { ...state.offset },
    clock: state.clock,
    rundown: { ...state.rundown },
    // events and groups have nested object so we can not just spread
    eventNow: structuredClone(state.eventNow),
    eventNext: structuredClone(state.eventNext),
    eventFlag: structuredClone(state.eventFlag),
    groupNow: structuredClone(state.groupNow),
  };
}

export function stateToTimerUpdateCheck(state = runtimeState): {
  phase: TimerPhase;
  playback: Playback;
  endAction: Maybe<EndAction>;
  current: Maybe<number>;
  clock: number;
  offset: Offset;
} {
  return {
    phase: state.timer.phase,
    playback: state.timer.playback,
    endAction: state.eventNow?.endAction ?? null,
    current: state.timer.current,
    clock: state.clock,
    offset: { ...state.offset },
  };
}

export const runtimeDTO = {
  stateToBroadcastResult,
  stateToTimerUpdateCheck,
};
