import { MidiClock } from './CLock.midi.js';
import { SystemClock } from './Clock.system.js';

enum Source {
  System = 'system',
  MIDI = 'MIDI',
}

export interface ClockInterface {
  getTime: () => number;
}

class Clock {
  private static instance: Clock;
  private readonly source: ClockInterface;
  private readonly sytemTime: ClockInterface;

  constructor(source?: Source) {
    if (Clock.instance) {
      return Clock.instance;
    }

    Clock.instance = this;
    this.sytemTime = new SystemClock();
    switch (source) {
      case Source.System: {
        this.source = this.sytemTime;
        break;
      }
      case Source.MIDI: {
        this.source = new MidiClock(0);
      }
    }
  }

  /**
   * Get current time from source
   */
  timeNow(): number {
    return this.source.getTime();
  }

  getSystemTime(): number {
    return this.sytemTime.getTime();
  }
}

export const clock = new Clock(Source.MIDI);
export { Source as ClockType };
export type ClockSource = {
  type: Source.MIDI | Source.System;
  input: number;
};
