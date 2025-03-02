import { RuntimeStore, SimpleDirection, SimplePlayback, TimerMessage } from 'ontime-types';

import { useRuntimeStore } from '../stores/runtime';
import { socketSendJson } from '../utils/socket';

const createSelector =
  <T>(selector: (state: RuntimeStore) => T) =>
  () =>
    useRuntimeStore(selector);

export const setClientRemote = {
  setIdentify: (payload: { target: string; identify: boolean }) => socketSendJson('client', payload),
  setRedirect: (payload: { target: string; redirect: string }) => socketSendJson('client', payload),
  setClientName: (payload: { target: string; rename: string }) => socketSendJson('client', payload),
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

export const useTimerSchedule = createSelector((state: RuntimeStore) => ({
  startedAt: state.timer.startedAt,
  expectedFinish: state.timer.expectedFinish,
  phase: state.timer.phase,
  playback: state.timer.playback,
}));

export const useTimerCurrent = createSelector((state: RuntimeStore) => ({
  current: state.timer.current,
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
  timerText: (payload: string) => socketSendJson('message', { timer: { text: payload } }),
  timerVisible: (payload: boolean) => socketSendJson('message', { timer: { visible: payload } }),
  externalText: (payload: string) => socketSendJson('message', { external: payload }),
  timerBlink: (payload: boolean) => socketSendJson('message', { timer: { blink: payload } }),
  timerBlackout: (payload: boolean) => socketSendJson('message', { timer: { blackout: payload } }),
  timerSecondary: (payload: TimerMessage['secondarySource']) =>
    socketSendJson('message', { timer: { secondarySource: payload } }),
};

export const usePlaybackControl = createSelector((state: RuntimeStore) => ({
  playback: state.timer.playback,
  selectedEventIndex: state.runtime.selectedEventIndex,
  numEvents: state.runtime.numEvents,
  timerPhase: state.timer.phase,
}));

export const setPlayback = {
  start: () => socketSendJson('start'),
  pause: () => socketSendJson('pause'),
  roll: () => socketSendJson('roll'),
  startNext: () => socketSendJson('start', 'next'),
  previous: () => {
    socketSendJson('load', 'previous');
  },
  next: () => {
    socketSendJson('load', 'next');
  },
  stop: () => {
    socketSendJson('stop');
  },
  reload: () => {
    socketSendJson('reload');
  },
  addTime: (amount: number) => {
    socketSendJson('addtime', amount);
  },
};

export const useInfoPanel = createSelector((state: RuntimeStore) => ({
  eventNow: state.eventNow,
  eventNext: state.eventNext,
  playback: state.timer.playback,
  selectedEventIndex: state.runtime.selectedEventIndex,
  numEvents: state.runtime.numEvents,
}));

export const useAuxTimerTime = createSelector((state: RuntimeStore) => state.auxtimer1.current);

export const useAuxTimerControl = createSelector((state: RuntimeStore) => ({
  playback: state.auxtimer1.playback,
  direction: state.auxtimer1.direction,
}));

export const setAuxTimer = {
  start: () => socketSendJson('auxtimer', { '1': SimplePlayback.Start }),
  pause: () => socketSendJson('auxtimer', { '1': SimplePlayback.Pause }),
  stop: () => socketSendJson('auxtimer', { '1': SimplePlayback.Stop }),
  setDirection: (direction: SimpleDirection) => socketSendJson('auxtimer', { '1': { direction } }),
  setDuration: (time: number) => socketSendJson('auxtimer', { '1': { duration: time } }),
};

export const useTimerSpeed = createSelector((state: RuntimeStore) => ({
  speed: state.timer.speed,
}));

export const setTimerSpeed = {
  getSpeed: () => socketSendJson('get-speed'),
  setSpeed: (speed: number) => socketSendJson('set-speed', speed),
};

export const useSelectedEventId = createSelector((state: RuntimeStore) => ({
  selectedEventId: state.eventNow?.id ?? null,
}));

export const useCurrentBlockId = createSelector((state: RuntimeStore) => ({
  currentBlockId: state.currentBlock.block?.id ?? null,
}));

export const setEventPlayback = {
  loadEvent: (id: string) => socketSendJson('load', { id }),
  startEvent: (id: string) => socketSendJson('start', { id }),
  start: () => socketSendJson('start'),
  pause: () => socketSendJson('pause'),
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

export const setClientName = (newName: string) => socketSendJson('set-client-name', newName);

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
  offset: state.runtime.offset,

  currentBlock: state.currentBlock,
}));

export const useTimelineStatus = createSelector((state: RuntimeStore) => ({
  clock: state.clock,
  offset: state.runtime.offset,
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

export const usePlayback = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.timer.playback,
  });

  return useRuntimeStore(featureSelector);
};
