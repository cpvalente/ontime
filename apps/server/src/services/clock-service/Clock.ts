import { eventStore } from '../../stores/EventStore.js';
import { NtpClock } from './Clock.ntp.js';
import { SystemClock } from './Clock.system.js';

import { ClockSource, SystemClockState, NtpClockState } from 'ontime-types';

export interface ClockInterface {
  init: () => void;
  getTime: () => number; //milliseconds since midnight
  close: () => void;
  offset: number; //offset in milliseconds
  settings: unknown;
  feedbackCallback: (state: SystemClockState | NtpClockState, message: string) => void;
}

class Clock {
  private static instance: Clock;
  private source: ClockInterface;
  private sytemTime: ClockInterface;

  constructor() {
    if (Clock.instance) {
      return Clock.instance;
    }
    Clock.instance = this;
    this.sytemTime = new SystemClock();
    this.source = this.sytemTime;
  }

  setSource(s: ClockSource, settings) {
    if (this.source !== undefined) {
      this.source.close();
    }
    switch (s) {
      case ClockSource.System: {
        this.source = this.sytemTime;
        this.source.feedbackCallback = this.feedback;
        this.source.init();
        break;
      }
      case ClockSource.NTP: {
        this.source = new NtpClock();
        this.source.settings = settings;
        this.source.feedbackCallback = this.feedback;
        this.source.init();
        break;
      }
    }
  }

  private feedback(state: SystemClockState | NtpClockState, message: string) {
    console.log('clockStatus', { state, message });
    eventStore.set('clockStatus', { state, message });
  }

  setOffset(offset: number) {
    this.source.offset = offset;
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

export const clock = new Clock();
