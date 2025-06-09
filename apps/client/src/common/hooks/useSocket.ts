import { OffsetMode, RuntimeStore, SimpleDirection, SimplePlayback, TimerMessage } from 'ontime-types';

import { useRuntimeStore } from '../stores/runtime';
import { sendApiSocket } from '../utils/socket';

const createSelector =
  <T>(selector: (state: RuntimeStore) => T) =>
  () =>
    useRuntimeStore(selector);

export const setClientRemote = {
  setIdentify: (payload: { target: string; identify: boolean }) => sendApiSocket('client', payload),
  setRedirect: (payload: { target: string; redirect: string }) => sendApiSocket('client', payload),
  setClientName: (payload: { target: string; rename: string }) => sendApiSocket('client', payload),
};

export const useRundownEditor = createSelector((state: RuntimeStore) => ({
  playback: state.timer.playback,
  selectedEventId: state.eventNow?.id ?? null,
  nextEventId: state.eventNext?.id ?? null,
}));

export const useOperator = createSelector((state: RuntimeStore) => ({
  playback: state.timer.playback,
  selectedEventId: state.eventNow?.id ?? null,
}));

export const useTimerViewControl = createSelector((state: RuntimeStore) => ({
  blackout: state.message.timer.blackout,
  blink: state.message.timer.blink,
  secondarySource: state.message.timer.secondarySource,
}));

export const useTimerMessageInput = createSelector((state: RuntimeStore) => ({
  text: state.message.timer.text,
  visible: state.message.timer.visible,
}));

export const useExternalMessageInput = createSelector((state: RuntimeStore) => ({
  text: state.message.external,
  visible: state.message.timer.secondarySource === 'external',
}));

export const useMessagePreview = createSelector((state: RuntimeStore) => ({
  blink: state.message.timer.blink,
  blackout: state.message.timer.blackout,
  phase: state.timer.phase,
  showAuxTimer: state.message.timer.secondarySource === 'aux',
  showExternalMessage: state.message.timer.secondarySource === 'external' && Boolean(state.message.external),
  showTimerMessage: state.message.timer.visible && Boolean(state.message.timer.text),
  timerType: state.eventNow?.timerType ?? null,
  countToEnd: state.eventNow?.countToEnd ?? false,
}));

export const setMessage = {
  timerText: (payload: string) => sendApiSocket('message', { timer: { text: payload } }),
  timerVisible: (payload: boolean) => sendApiSocket('message', { timer: { visible: payload } }),
  externalText: (payload: string) => sendApiSocket('message', { external: payload }),
  timerBlink: (payload: boolean) => sendApiSocket('message', { timer: { blink: payload } }),
  timerBlackout: (payload: boolean) => sendApiSocket('message', { timer: { blackout: payload } }),
  timerSecondary: (payload: TimerMessage['secondarySource']) =>
    sendApiSocket('message', { timer: { secondarySource: payload } }),
};

export const usePlaybackControl = createSelector((state: RuntimeStore) => ({
  playback: state.timer.playback,
  selectedEventIndex: state.runtime.selectedEventIndex,
  numEvents: state.runtime.numEvents,
  timerPhase: state.timer.phase,
}));

export const setPlayback = {
  start: () => sendApiSocket('start'),
  pause: () => sendApiSocket('pause'),
  roll: () => sendApiSocket('roll'),
  startNext: () => sendApiSocket('start', 'next'),
  previous: () => {
    sendApiSocket('load', 'previous');
  },
  next: () => {
    sendApiSocket('load', 'next');
  },
  stop: () => {
    sendApiSocket('stop');
  },
  reload: () => {
    sendApiSocket('reload');
  },
  addTime: (amount: number) => {
    sendApiSocket('addtime', amount);
  },
};

export const useAuxTimerTime = createSelector((state: RuntimeStore) => state.auxtimer1.current);

export const useAuxTimerControl = createSelector((state: RuntimeStore) => ({
  playback: state.auxtimer1.playback,
  direction: state.auxtimer1.direction,
}));

export const setAuxTimer = {
  start: () => sendApiSocket('auxtimer', { '1': SimplePlayback.Start }),
  pause: () => sendApiSocket('auxtimer', { '1': SimplePlayback.Pause }),
  stop: () => sendApiSocket('auxtimer', { '1': SimplePlayback.Stop }),
  setDirection: (direction: SimpleDirection) => sendApiSocket('auxtimer', { '1': { direction } }),
  setDuration: (time: number) => sendApiSocket('auxtimer', { '1': { duration: time } }),
};

export const useSelectedEventId = createSelector((state: RuntimeStore) => ({
  selectedEventId: state.eventNow?.id ?? null,
}));

export const useCurrentBlockId = createSelector((state: RuntimeStore) => ({
  currentBlockId: state.currentBlock.block?.id ?? null,
}));

export const setEventPlayback = {
  loadEvent: (id: string) => sendApiSocket('load', { id }),
  startEvent: (id: string) => sendApiSocket('start', { id }),
  start: () => sendApiSocket('start'),
  pause: () => sendApiSocket('pause'),
};

export const useTimer = createSelector((state: RuntimeStore) => ({
  ...state.timer,
}));

export const useClock = createSelector((state: RuntimeStore) => ({
  clock: state.clock,
}));

/** Used by the progress bar components */
export const useProgressData = createSelector((state: RuntimeStore) => ({
  current: state.timer.current,
  duration: state.timer.duration,
  timeWarning: state.eventNow?.timeWarning ?? null,
  timeDanger: state.eventNow?.timeDanger ?? null,
}));

export const useRuntimeOverview = createSelector((state: RuntimeStore) => ({
  plannedStart: state.runtime.plannedStart,
  actualStart: state.runtime.actualStart,
  plannedEnd: state.runtime.plannedEnd,
  expectedEnd: state.runtime.expectedEnd,
}));

export const useRuntimePlaybackOverview = createSelector((state: RuntimeStore) => ({
  playback: state.timer.playback,
  clock: state.clock,

  numEvents: state.runtime.numEvents,
  selectedEventIndex: state.runtime.selectedEventIndex,
  offset: state.runtime.offsetMode === OffsetMode.Absolute ? state.runtime.offset : state.runtime.relativeOffset,

  currentBlock: state.currentBlock,
}));

export const useTimelineStatus = createSelector((state: RuntimeStore) => ({
  clock: state.clock,
  offset: state.runtime.offset,
}));

export const useTimeUntilData = createSelector((state: RuntimeStore) => ({
  clock: state.clock,
  offset: state.runtime.offsetMode === OffsetMode.Absolute ? state.runtime.offset : state.runtime.relativeOffset,
  offsetMode: state.runtime.offsetMode,
  currentDay: state.eventNow?.dayOffset ?? 0,
  actualStart: state.runtime.actualStart,
  plannedStart: state.runtime.plannedStart,
}));

export const useCurrentDay = createSelector((state: RuntimeStore) => ({
  currentDay: state.eventNow?.dayOffset ?? 0,
}));

export const useRuntimeOffset = createSelector((state: RuntimeStore) => ({
  offset: state.runtime.offset,
}));

export const usePing = createSelector((state: RuntimeStore) => ({
  ping: state.ping,
}));

/** convert ping into a derived value which changes less often */
export const useIsOnline = createSelector((state: RuntimeStore) => ({
  isOnline: state.ping > 0,
}));

export const useOffsetMode = createSelector((state: RuntimeStore) => ({
  offsetMode: state.runtime.offsetMode,
}));

export const setOffsetMode = (payload: OffsetMode) => sendApiSocket('offsetmode', payload);

export const usePlayback = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.timer.playback,
  });

  return useRuntimeStore(featureSelector);
};
