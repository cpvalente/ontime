import { OffsetMode, RuntimeStore, SimpleDirection, SimplePlayback, TimerMessage } from 'ontime-types';

import { useRuntimeStore } from '../stores/runtime';
import { sendSocket } from '../utils/socket';

const createSelector =
  <T>(selector: (state: RuntimeStore) => T) =>
  () =>
    useRuntimeStore(selector);

export const setClientRemote = {
  setIdentify: (payload: { target: string; identify: boolean }) => sendSocket('client', payload),
  setRedirect: (payload: { target: string; redirect: string }) => sendSocket('client', payload),
  setClientName: (payload: { target: string; rename: string }) => sendSocket('client', payload),
};

export const useRundownEditor = createSelector((state: RuntimeStore) => ({
  playback: state.timer.playback,
  selectedEventId: state.eventNow?.id ?? null,
  nextEventId: state.eventNext?.id ?? null,
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
  text: state.message.secondary,
  visible: state.message.timer.secondarySource === 'secondary',
}));

export const useMessagePreview = createSelector((state: RuntimeStore) => ({
  blink: state.message.timer.blink,
  blackout: state.message.timer.blackout,
  phase: state.timer.phase,
  secondarySource: state.message.timer.secondarySource,
  showTimerMessage: state.message.timer.visible && Boolean(state.message.timer.text),
  timerType: state.eventNow?.timerType ?? null,
  countToEnd: state.eventNow?.countToEnd ?? false,
}));

export const setMessage = {
  timerText: (payload: string) => sendSocket('message', { timer: { text: payload } }),
  timerVisible: (payload: boolean) => sendSocket('message', { timer: { visible: payload } }),
  secondaryMessage: (payload: string) => sendSocket('message', { secondary: payload }),
  timerBlink: (payload: boolean) => sendSocket('message', { timer: { blink: payload } }),
  timerBlackout: (payload: boolean) => sendSocket('message', { timer: { blackout: payload } }),
  timerSecondarySource: (payload: TimerMessage['secondarySource']) =>
    sendSocket('message', { timer: { secondarySource: payload } }),
};

export const usePlaybackControl = createSelector((state: RuntimeStore) => ({
  playback: state.timer.playback,
  selectedEventIndex: state.runtime.selectedEventIndex,
  numEvents: state.runtime.numEvents,
  timerPhase: state.timer.phase,
}));

export const setPlayback = {
  start: () => sendSocket('start', undefined),
  pause: () => sendSocket('pause', undefined),
  roll: () => sendSocket('roll', undefined),
  startNext: () => sendSocket('start', 'next'),
  previous: () => {
    sendSocket('load', 'previous');
  },
  next: () => {
    sendSocket('load', 'next');
  },
  stop: () => {
    sendSocket('stop', undefined);
  },
  reload: () => {
    sendSocket('reload', undefined);
  },
  addTime: (amount: number) => {
    sendSocket('addtime', amount);
  },
};

export const useAuxTimersTime = createSelector((state: RuntimeStore) => {
  return {
    aux1: state.auxtimer1.current,
    aux2: state.auxtimer2.current,
    aux3: state.auxtimer3.current,
  };
});

export const useAuxTimerTime = (index: number) =>
  createSelector((state: RuntimeStore) => {
    if (index === 1) return state.auxtimer1.current;
    if (index === 2) return state.auxtimer2.current;
    return state.auxtimer3.current;
  })();

export const useAuxTimerControl = (index: number) =>
  createSelector((state: RuntimeStore) => {
    if (index === 1)
      return {
        playback: state.auxtimer1.playback,
        direction: state.auxtimer1.direction,
      };
    if (index === 2)
      return {
        playback: state.auxtimer2.playback,
        direction: state.auxtimer2.direction,
      };
    return {
      playback: state.auxtimer3.playback,
      direction: state.auxtimer3.direction,
    };
  })();

export const setAuxTimer = {
  start: (index: number) => sendSocket('auxtimer', { [index]: SimplePlayback.Start }),
  pause: (index: number) => sendSocket('auxtimer', { [index]: SimplePlayback.Pause }),
  stop: (index: number) => sendSocket('auxtimer', { [index]: SimplePlayback.Stop }),
  setDirection: (index: number, direction: SimpleDirection) => sendSocket('auxtimer', { [index]: { direction } }),
  setDuration: (index: number, time: number) => sendSocket('auxtimer', { [index]: { duration: time } }),
};

export const useSelectedEventId = createSelector((state: RuntimeStore) => ({
  selectedEventId: state.eventNow?.id ?? null,
}));

export const useCurrentBlockId = createSelector((state: RuntimeStore) => ({
  currentBlockId: state.blockNow?.id ?? null,
}));

export const setEventPlayback = {
  loadEvent: (id: string) => sendSocket('load', { id }),
  startEvent: (id: string) => sendSocket('start', { id }),
  start: () => sendSocket('start', undefined),
  pause: () => sendSocket('pause', undefined),
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

  blockStartAt: state.blockNow?.startedAt ?? null,
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

export const setOffsetMode = (payload: OffsetMode) => sendSocket('offsetmode', payload);

export const usePlayback = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.timer.playback,
  });

  return useRuntimeStore(featureSelector);
};
