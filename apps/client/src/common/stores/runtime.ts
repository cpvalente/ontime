import isEqual from 'react-fast-compare';
import { Playback, RuntimeStore, SimpleDirection, SimplePlayback } from 'ontime-types';
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
    selectedEventIndex: null,
    numEvents: 0,
    offset: 0,
    plannedStart: 0,
    plannedEnd: 0,
    actualStart: null,
    expectedEnd: null,
  },
  eventNow: null,
  eventNext: null,
  publicEventNow: null,
  publicEventNext: null,
  auxtimer1: {
    current: 0,
    direction: SimpleDirection.CountUp,
    duration: 0,
    playback: SimplePlayback.Stop,
  },
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

/**
 * Allows patching a property of the runtime store
 * @param key
 * @param value
 */
export function patchRuntime<K extends keyof RuntimeStore>(key: K, value: RuntimeStore[K]): void {
  const state = runtimeStore.getState();
  state[key] = value;
  runtimeStore.setState({ ...state });
}
