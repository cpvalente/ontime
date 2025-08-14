import { SimpleDirection, SimplePlayback } from './AuxTimer.type.js';
import { OffsetMode } from './Offset.type.js';
import { Playback } from './Playback.type.js';
import type { RuntimeStore } from './RuntimeStore.type.js';
import { TimerPhase } from './TimerState.type.js';

export const runtimeStorePlaceholder: Readonly<RuntimeStore> = {
  clock: 0,
  timer: {
    addedTime: 0,
    current: null, // changes on every update
    duration: null, // only changes if event changes
    elapsed: null, // changes on every update
    expectedFinish: null, // change can only be initiated by user, can roll over midnight
    phase: TimerPhase.None, // can change on update or user action
    playback: Playback.Stop, // change initiated by user
    secondaryTimer: null, // change on every update
    startedAt: null, // change can only be initiated by user
  },
  message: {
    timer: {
      text: '',
      visible: false,
      blink: false,
      blackout: false,
      secondarySource: null,
    },
    secondary: '',
  },
  rundown: {
    selectedEventIndex: null, // changes if rundown changes or we load a new event
    numEvents: 0, // change initiated by user
    plannedStart: 0, // only changes if event changes
    plannedEnd: 0, // only changes if event changes, overflows over dayInMs
    actualStart: null, // set once we start the timer
  },
  offset: {
    absolute: 0, // changes at runtime
    relative: 0, // changes at runtime
    mode: OffsetMode.Absolute,
    expectedFlagStart: null,
    expectedGroupEnd: null,
    expectedRundownEnd: null,
  },
  groupNow: null,
  eventNow: null,
  eventNext: null,
  eventFlag: null,
  auxtimer1: {
    current: 0,
    direction: SimpleDirection.CountUp,
    duration: 0,
    playback: SimplePlayback.Stop,
  },
  auxtimer2: {
    current: 0,
    direction: SimpleDirection.CountUp,
    duration: 0,
    playback: SimplePlayback.Stop,
  },
  auxtimer3: {
    current: 0,
    direction: SimpleDirection.CountUp,
    duration: 0,
    playback: SimplePlayback.Stop,
  },
  ping: -1,
};
