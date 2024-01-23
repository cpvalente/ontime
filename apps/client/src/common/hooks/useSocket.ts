import { RuntimeStore } from 'ontime-types';

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
    public: state.message.public,
    lower: state.message.lower,
    external: state.message.external,
    onAir: state.onAir,
  });

  return useRuntimeStore(featureSelector);
};

export const setMessage = {
  timerText: (payload: string) => socketSendJson('message', { timer: { text: payload } }),
  timerVisible: (payload: boolean) => socketSendJson('message', { timer: { visible: payload } }),
  publicText: (payload: string) => socketSendJson('message', { public: { text: payload } }),
  publicVisible: (payload: boolean) => socketSendJson('message', { public: { visible: payload } }),
  lowerText: (payload: string) => socketSendJson('message', { lower: { text: payload } }),
  lowerVisible: (payload: boolean) => socketSendJson('message', { lower: { visible: payload } }),
  externalText: (payload: string) => socketSendJson('message', { external: { visible: payload } }),
  externalVisible: (payload: boolean) => socketSendJson('message', { external: { visible: payload } }),
  onAir: (payload: boolean) => socketSendJson('onAir', payload),
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
  startNext: () => socketSendJson('start', { next: true }),
  previous: () => {
    socketSendJson('load', { previous: true });
  },
  next: () => {
    socketSendJson('load', { next: true });
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
    playback: state.timer.playback,
    clock: state.clock,
    selectedEventIndex: state.runtime.selectedEventIndex,
    numEvents: state.runtime.numEvents,
  });

  return useRuntimeStore(featureSelector);
};
