import isEqual from 'react-fast-compare';
import { Playback, RuntimeStore } from 'ontime-types';
import { createWithEqualityFn, useStoreWithEqualityFn } from 'zustand/traditional';

export const runtimeStorePlaceholder: RuntimeStore = {
  clock: 0,
  timer: {
    addedTime: 0,
    current: null,
    duration: null,
    elapsed: null,
    expectedFinish: null,
    finishedAt: null,
    playback: Playback.Stop,
    secondaryTimer: null,
    startedAt: null,
  },
  timerMessage: {
    text: '',
    visible: false,
    timerBlink: false,
    timerBlackout: false,
  },
  publicMessage: {
    text: '',
    visible: false,
  },
  lowerMessage: {
    text: '',
    visible: false,
  },
  externalMessage: {
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
  eventNow: null,
  eventNext: null,
  publicEventNow: null,
  publicEventNext: null,
};

const deepCompare = <T>(a: T, b: T) => isEqual(a, b);

export const runtime = createWithEqualityFn<RuntimeStore>(
  () => ({
    ...runtimeStorePlaceholder,
  }),
  deepCompare,
);

export const useRuntimeStore = <T>(selector: (state: RuntimeStore) => T) =>
  useStoreWithEqualityFn(runtime, selector, deepCompare);
