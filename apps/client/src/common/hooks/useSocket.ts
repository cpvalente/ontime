import { RuntimeStore } from 'ontime-types';

import { useRuntimeStore } from '../stores/runtime';
import { socketSendJson } from '../utils/socket';

export const useRundownEditor = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.playback,
    selectedEventId: state.loaded.selectedEventId,
    nextEventId: state.loaded.nextEventId,
  });

  return useRuntimeStore(featureSelector);
};

export const useOperator = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.playback,
    selectedEventId: state.loaded.selectedEventId,
  });

  return useRuntimeStore(featureSelector);
};

export const useMessageControl = () => {
  const featureSelector = (state: RuntimeStore) => ({
    timerMessage: state.timerMessage,
    publicMessage: state.publicMessage,
    lowerMessage: state.lowerMessage,
    externalMessage: state.externalMessage,
    onAir: state.onAir,
  });

  return useRuntimeStore(featureSelector);
};

export const setMessage = {
  presenterText: (payload: string) => socketSendJson('message', { timer: { text: payload } }),
  presenterVisible: (payload: boolean) => socketSendJson('message', { timer: { visible: payload } }),
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
    playback: state.playback,
    selectedEventIndex: state.loaded.selectedEventIndex,
    numEvents: state.loaded.numEvents,
  });

  return useRuntimeStore(featureSelector);
};

export const setPlayback = {
  start: () => socketSendJson('start'),
  pause: () => socketSendJson('pause'),
  roll: () => socketSendJson('roll'),
  startNext: () => socketSendJson('startnext'),
  previous: () => {
    socketSendJson('previous');
  },
  next: () => {
    socketSendJson('next');
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
    playback: state.playback,
    selectedEventIndex: state.loaded.selectedEventIndex,
    numEvents: state.loaded.numEvents,
  });

  return useRuntimeStore(featureSelector);
};

export const useCuesheet = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.playback,
    selectedEventId: state.loaded.selectedEventId,
    selectedEventIndex: state.loaded.selectedEventIndex,
    numEvents: state.loaded.numEvents,
    titleNow: state.eventNow?.title || '',
  });

  return useRuntimeStore(featureSelector);
};

export const setEventPlayback = {
  loadEvent: (eventId: string) => socketSendJson('loadid', eventId),
  startEvent: (eventId: string) => socketSendJson('startid', eventId),
  start: () => socketSendJson('start'),
  pause: () => socketSendJson('pause'),
};

export const useTimer = () => {
  const featureSelector = (state: RuntimeStore) => ({
    ...state.timer,
  });

  return useRuntimeStore(featureSelector);
};

export const setClientName = (newName: string) => socketSendJson('set-client-name', newName);

export const useRuntimeOverview = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.playback,
    clock: state.timer.clock,
    numEvents: state.loaded.numEvents,
    selectedEventIndex: state.loaded.selectedEventIndex,
  });

  return useRuntimeStore(featureSelector);
};
