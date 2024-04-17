import { RuntimeStore, SimpleDirection, SimplePlayback } from 'ontime-types';

import { useRuntimeStore } from '../stores/runtime';
import { socketSendJson } from '../utils/socket';

export const useRundownEditor = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.timer.playback,
    selectedEventId: state.eventNow?.id ?? null,
    nextEventId: state.eventNext?.id ?? null,
  });

  return useRuntimeStore(featureSelector);
};

export const useOperator = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.timer.playback,
    selectedEventId: state.eventNow?.id ?? null,
  });

  return useRuntimeStore(featureSelector);
};

export const useMessageControl = () => {
  const featureSelector = (state: RuntimeStore) => ({
    timer: state.message.timer,
    lower: state.message.lower,
    external: state.message.external,
    onAir: state.onAir,
  });

  return useRuntimeStore(featureSelector);
};

export const setMessage = {
  timerText: (payload: string) => socketSendJson('message', { timer: { text: payload } }),
  timerVisible: (payload: boolean) => socketSendJson('message', { timer: { visible: payload } }),
  lowerText: (payload: string) => socketSendJson('message', { lower: { text: payload } }),
  lowerVisible: (payload: boolean) => socketSendJson('message', { lower: { visible: payload } }),
  timerBlink: (payload: boolean) => socketSendJson('message', { timer: { blink: payload } }),
  timerBlackout: (payload: boolean) => socketSendJson('message', { timer: { blackout: payload } }),
};

export const usePlaybackControl = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.timer.playback,
    selectedEventIndex: state.runtime.selectedEventIndex,
    numEvents: state.runtime.numEvents,
  });

  return useRuntimeStore(featureSelector);
};

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

export const useInfoPanel = () => {
  const featureSelector = (state: RuntimeStore) => ({
    eventNow: state.eventNow,
    eventNext: state.eventNext,
    playback: state.timer.playback,
    selectedEventIndex: state.runtime.selectedEventIndex,
    numEvents: state.runtime.numEvents,
  });

  return useRuntimeStore(featureSelector);
};

export const useAuxTimerTime = () => {
  const featureSelector = (state: RuntimeStore) => state.auxtimer1.current;

  return useRuntimeStore(featureSelector);
};

export const useAuxTimerControl = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.auxtimer1.playback,
    direction: state.auxtimer1.direction,
  });

  return useRuntimeStore(featureSelector);
};

export const setAuxTimer = {
  start: () => socketSendJson('auxtimer', { '1': SimplePlayback.Start }),
  pause: () => socketSendJson('auxtimer', { '1': SimplePlayback.Pause }),
  stop: () => socketSendJson('auxtimer', { '1': SimplePlayback.Stop }),
  setDirection: (direction: SimpleDirection) => socketSendJson('auxtimer', { '1': { direction } }),
  setDuration: (time: number) => socketSendJson('auxtimer', { '1': { duration: time } }),
};

export const useCuesheet = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.timer.playback,
    selectedEventId: state.eventNow?.id ?? null,
    selectedEventIndex: state.runtime.selectedEventIndex,
    numEvents: state.runtime.numEvents,
    titleNow: state.eventNow?.title || '',
  });

  return useRuntimeStore(featureSelector);
};

export const setEventPlayback = {
  loadEvent: (id: string) => socketSendJson('load', { id }),
  startEvent: (id: string) => socketSendJson('start', { id }),
  start: () => socketSendJson('start'),
  pause: () => socketSendJson('pause'),
};

export const useTimer = () => {
  const featureSelector = (state: RuntimeStore) => ({
    ...state.timer,
  });

  return useRuntimeStore(featureSelector);
};

export const useClock = () => {
  const featureSelector = (state: RuntimeStore) => ({
    clock: state.clock,
  });
  return useRuntimeStore(featureSelector);
};

/** Used by the progress bar components */
export const useProgressData = () => {
  const featureSelector = (state: RuntimeStore) => ({
    addedTime: state.timer.addedTime,
    current: state.timer.current,
    duration: state.timer.duration,
    timeWarning: state.eventNow?.timeWarning ?? null,
    timeDanger: state.eventNow?.timeDanger ?? null,
  });
  return useRuntimeStore(featureSelector);
};

export const setClientName = (newName: string) => socketSendJson('set-client-name', newName);

export const useRuntimeOverview = () => {
  const featureSelector = (state: RuntimeStore) => ({
    plannedStart: state.runtime.plannedStart,
    actualStart: state.runtime.actualStart,
    plannedEnd: state.runtime.plannedEnd,
    expectedEnd: state.runtime.expectedEnd,
  });

  return useRuntimeStore(featureSelector);
};

export const useRuntimePlaybackOverview = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.timer.playback,
    clock: state.clock,

    numEvents: state.runtime.numEvents,
    selectedEventIndex: state.runtime.selectedEventIndex,
    offset: state.runtime.offset,
  });

  return useRuntimeStore(featureSelector);
};
