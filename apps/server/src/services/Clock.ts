import { MidiClock } from './Clock.midi.js';
import { NtpClock } from './Clock.ntp.js';
import { SystemClock } from './Clock.system.js';

import { ClockSource } from 'ontime-types';

export interface ClockInterface {
  getTime: () => number; //milliseconds since midnight
  close: () => void;
  tcOffset: number; //offset in milliseconds
  settings: string;
}

class Clock {
  private static instance: Clock;
  private source: ClockInterface;
  private readonly sytemTime: ClockInterface;

  constructor(source?: ClockSource) {
    if (Clock.instance) {
      return Clock.instance;
    }

    Clock.instance = this;
    this.sytemTime = new SystemClock();
    if (source) {
      this.setSource(source, '');
    }
  }

  setSource(s: ClockSource, settings: string) {
    if (this.source !== undefined) {
      this.source.close();
    }
    switch (s) {
      case ClockSource.System: {
        this.source = this.sytemTime;
        break;
      }
      case ClockSource.MIDI: {
        this.source = new MidiClock();
        this.source.settings = settings;
        break;
      }
      case ClockSource.NTP: {
        this.source = new NtpClock();
        this.source.settings = settings;
        break;
      }
    }
  }

  setOffset(offset: number) {
    this.source.tcOffset = offset;
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

export const clock = new Clock(ClockSource.System);