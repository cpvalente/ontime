import { RuntimeStore } from 'ontime-types';

import { deepCompare, useRuntimeStore } from '../stores/runtime';
import { socketSendJson } from '../utils/socket';

export const useRundownEditor = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.playback,
    selectedEventId: state.loaded.selectedEventId,
    nextEventId: state.loaded.nextEventId,
  });

  return useRuntimeStore(featureSelector, deepCompare);
};

export const useMessageControl = () => {
  const featureSelector = (state: RuntimeStore) => ({
    timerMessage: state.timerMessage,
    publicMessage: state.publicMessage,
    lowerMessage: state.lowerMessage,
    onAir: state.onAir,
  });

  return useRuntimeStore(featureSelector, deepCompare);
};

export const setMessage = {
  presenterText: (payload: string) => socketSendJson('set-timer-message-text', payload),
  presenterVisible: (payload: boolean) => socketSendJson('set-timer-message-visible', payload),
  publicText: (payload: string) => socketSendJson('set-public-message-text', payload),
  publicVisible: (payload: boolean) => socketSendJson('set-public-message-visible', payload),
  lowerText: (payload: string) => socketSendJson('set-lower-message-text', payload),
  lowerVisible: (payload: boolean) => socketSendJson('set-lower-message-visible', payload),
  onAir: (payload: boolean) => socketSendJson('set-onAir', payload),
};

export const usePlaybackControl = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.playback,
    selectedEventIndex: state.loaded.selectedEventIndex,
    numEvents: state.loaded.numEvents,
  });

  return useRuntimeStore(featureSelector, deepCompare);
};

export const setPlayback = {
  start: () => socketSendJson('start'),
  pause: () => socketSendJson('pause'),
  roll: () => socketSendJson('roll'),
  startNext: () => socketSendJson('start-next'),
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
  delay: (amount: number) => {
    socketSendJson('delay', amount);
  },
};

export const useInfoPanel = () => {
  const featureSelector = (state: RuntimeStore) => ({
    titles: state.titles,
    playback: state.playback,
    selectedEventIndex: state.loaded.selectedEventIndex,
    numEvents: state.loaded.numEvents,
  });

  return useRuntimeStore(featureSelector, deepCompare);
};

export const useCuesheet = () => {
  const featureSelector = (state: RuntimeStore) => ({
    playback: state.playback,
    selectedEventId: state.loaded.selectedEventId,
    selectedEventIndex: state.loaded.selectedEventIndex,
    numEvents: state.loaded.numEvents,
    titleNow: state.titles.titleNow,
  });

  return useRuntimeStore(featureSelector, deepCompare);
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

  return useRuntimeStore(featureSelector, deepCompare);
};
