import { Maybe } from 'ontime-types';
import { runtimeState } from '../../stores/runtimeState.js';

function stateToReport(state = runtimeState): {
  eventId: Maybe<string>;
  startedAt: Maybe<number>;
  clock: number;
} {
  return {
    eventId: state.eventNow?.id ?? null,
    startedAt: state.timer.startedAt,
    clock: state.clock,
  };
}

export const reportDTO = {
  stateToReport,
};
