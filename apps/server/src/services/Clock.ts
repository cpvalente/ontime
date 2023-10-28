import easymidi from 'easymidi';

enum Source {
  System = 'system',
  MIDI = 'MIDI',
}

class Clock {
  private static instance: Clock;
  private readonly source: Source;
  private readonly midiIn;
  private midiState = {
    rate: 0,
    hourMsbit: 0,
    hourLsbits: 0,
    minuteMsbits: 0,
    minuteLsbits: 0,
    secondMsbits: 0,
    secondLsbits: 0,
    frameMsbit: 0,
    frameLsbits: 0,
    total: 0,
  };

  constructor(source?: Source) {
    if (Clock.instance) {
      return Clock.instance;
    }

    Clock.instance = this;

    this.source = source || Source.System;
    if (source === Source.MIDI) {
      this.midiIn = new easymidi.Input('loopMIDI Port');
      this.midiIn.on('mtc', (mtc) => {
        switch (mtc.type) {
          case 0: {
            this.midiState.frameLsbits = mtc.value & 0b00001111;
            this.midiState.total =
              ((this.midiState.frameMsbit + this.midiState.frameLsbits) / this.midiState.rate) * 1000 +
              (this.midiState.secondMsbits + this.midiState.secondLsbits) * 1000 +
              (this.midiState.minuteMsbits + this.midiState.minuteLsbits) * 60000 +
              (this.midiState.hourMsbit + this.midiState.hourLsbits) * 3600000;
            break;
          }
          case 1: {
            this.midiState.frameMsbit = (mtc.value & 0b00000001) << 4;
            break;
          }
          case 2: {
            this.midiState.secondLsbits = mtc.value & 0b00001111;
            break;
          }
          case 3: {
            this.midiState.secondMsbits = (mtc.value & 0b00000011) << 4;
            break;
          }
          case 4: {
            this.midiState.minuteLsbits = mtc.value & 0b00001111;
            break;
          }
          case 5: {
            this.midiState.minuteMsbits = (mtc.value & 0b00000011) << 4;
            break;
          }
          case 6: {
            this.midiState.hourLsbits = mtc.value & 0b00001111;
            break;
          }
          case 7: {
            this.midiState.hourMsbit = (mtc.value & 0b00000001) << 4;
            this.midiState.rate = [24, 25, 29.97, 30][(mtc.value >> 1) & 0b00000011];
            break;
          }
        }
      });
    }
  }

  /**
   * Get current time from source
   */
  timeNow(): number {
    switch (this.source) {
      case Source.System:
        return this.getSystemTime();
      case Source.MIDI:
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
    return this.midiState.total;
    // return this.getSystemTime();

    // throw new Error('Not implemented');
  }
}

export const clock = new Clock(Source.MIDI);
