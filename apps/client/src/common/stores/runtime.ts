import { useSyncExternalStore } from 'react';
import { Playback, RuntimeStore } from 'ontime-types';

import { RUNTIME } from '../api/apiConstants';
import { ontimeQueryClient } from '../queryClient';

import createStore from './createStore';

export const runtimeStorePlaceholder = {
  timer: {
    clock: 0,
    current: null,
    elapsed: null,
    expectedFinish: null,
    addedTime: 0,
    startedAt: null,
    finishedAt: null,
    secondaryTimer: null,
    selectedEventId: null,
    duration: null,
    timerType: null,
  },
  playback: Playback.Stop,
  timerMessage: {
    text: '',
    visible: false,
  },
  publicMessage: {
    text: '',
    visible: false,
  },
  lowerMessage: {
    text: '',
    visible: false,
  },
  onAir: false,
  loaded: {
    numEvents: 0,
    selectedEventIndex: null,
    selectedEventId: null,
    selectedPublicEventId: null,
    nextEventId: null,
    nextPublicEventId: null,
  },
  titles: {
    titleNow: null,
    subtitleNow: null,
    presenterNow: null,
    noteNow: null,
    titleNext: null,
    subtitleNext: null,
    presenterNext: null,
    noteNext: null,
  },
  titlesPublic: {
    titleNow: null,
    subtitleNow: null,
    presenterNow: null,
    noteNow: null,
    titleNext: null,
    subtitleNext: null,
    presenterNext: null,
    noteNext: null,
  },
};

export const runtime = createStore<RuntimeStore>(runtimeStorePlaceholder);

export const useRuntimeStore = () => {
  const data = useSyncExternalStore(runtime.subscribe, runtime.get);

  // inject the data to react query to leverage dev tools for debugging
  if (import.meta.env.DEV) {
    ontimeQueryClient.setQueryData(RUNTIME, data);
  }
  return data;
};
