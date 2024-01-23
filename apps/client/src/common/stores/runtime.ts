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
  onAir: false,
  message: {
    timer: {
      text: '',
      visible: false,
      blink: false,
      blackout: false,
    },
    public: {
      text: '',
      visible: false,
    },
    lower: {
      text: '',
      visible: false,
    },
    external: {
      text: '',
      visible: false,
    },
  },
  runtime: {
    numEvents: 0,
    selectedEventIndex: null,
  },
  eventNow: null,
  eventNext: null,
  publicEventNow: null,
  publicEventNext: null,
};

const deepCompare = <T>(a: T, b: T) => isEqual(a, b);

export const runtimeStore = createWithEqualityFn<RuntimeStore>(
  () => ({
    ...runtimeStorePlaceholder,
  }),
  deepCompare,
);

export const useRuntimeStore = <T>(selector: (state: RuntimeStore) => T) =>
  useStoreWithEqualityFn(runtimeStore, selector, deepCompare);
