enum Source {
  System = 'system',
  MIDI = 'MIDI',
}

/**
 * Service manages retrieving current time from a managed time source
 */
class Clock {
  private static instance: Clock;
  private readonly source: Source;

  constructor(source?: Source) {
    if (Clock.instance) {
      return Clock.instance;
    }

    Clock.instance = this;

    this.source = source || Source.System;
  }

  /**
   * Get current time from source
   */
  timeNow(): number {
    switch (this.source) {
      case Source.System:
        return this.getSystemTime();
      case Source.MIDI:
        // @ts-expect-error -- not implemented
        return this.getMidiTime();
      default:
        throw new Error('Invalid time source');
    }
  }

  /**
   * Get current time from system
   */
  getSystemTime() {
    const now = new Date();

    // extract milliseconds since midnight
    let elapsed = now.getHours() * 3600000;
    elapsed += now.getMinutes() * 60000;
    elapsed += now.getSeconds() * 1000;
    elapsed += now.getMilliseconds();
    return elapsed;
  }

  /**
   * Get current time from MIDI
   */
  getMidiTime() {
    throw new Error('Not implemented');
  }
}

export const clock = new Clock();
