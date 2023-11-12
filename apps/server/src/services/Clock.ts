import { MidiClock } from './Clock.midi.js';
import { NtpClock } from './Clock.ntp.js';
import { SystemClock } from './Clock.system.js';

enum Source {
  System = 'system',
  MIDI = 'MIDI',
  NTP = 'NTP',
}

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

  constructor(source?: Source) {
    if (Clock.instance) {
      return Clock.instance;
    }

    Clock.instance = this;
    this.sytemTime = new SystemClock();
    if (source) {
      this.setSource(source, '');
    }
  }

  setSource(s: Source, settings: string) {
    if (this.source !== undefined) {
      this.source.close();
    }
    switch (s) {
      case Source.System: {
        this.source = this.sytemTime;
        break;
      }
      case Source.MIDI: {
        this.source = new MidiClock();
        this.source.settings = settings;
        break;
      }
      case Source.NTP: {
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

export const clock = new Clock(Source.System);
export { Source as ClockType };
export type ClockSource = {
  type: Source;
  settings: string;
  offset: number;
};
