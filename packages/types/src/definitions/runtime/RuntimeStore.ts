import { SimpleDirection, SimplePlayback } from './AuxTimer.type.js';
import { Playback } from './Playback.type.js';
import type { RuntimeStore } from './RuntimeStore.type.js';
import { TimerPhase } from './TimerState.type.js';

export const runtimeStorePlaceholder: RuntimeStore = {
  clock: 0,
  timer: {
    addedTime: 0,
    current: null,
    duration: null,
    elapsed: null,
    expectedFinish: null,
    finishedAt: null,
    phase: TimerPhase.None,
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
      secondarySource: null,
    },
    external: '',
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
  currentBlock: {
    block: null,
    startedAt: null,
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
  ping: -1,
};
