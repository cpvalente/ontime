import { logger } from '../classes/Logger.js';
import { LogOrigin } from 'ontime-types';
import easymidi from 'easymidi';
import { ClockInterface } from './Clock.js';

export class MidiClock implements ClockInterface {
  private midiIn: easymidi.Input;
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

  public tcOffset: number = 0;

  public set settings(v: string) {
    let index = easymidi.getInputs().findIndex((midiInput) => midiInput === v);
    if (index === -1) {
      if (this.midiIn === undefined) {
        index = 0;
      } else {
        index = easymidi.getInputs().findIndex((midiInput) => midiInput === this.midiIn.name);
      }
    }

    this.midiIn?.close();
    this.midiIn = new easymidi.Input(easymidi.getInputs()[index]);
    console.log(LogOrigin.Server, `CLOCK: MTC: Source is now ${this.midiIn.name}`);
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

  public get settings(): string {
    if (this.midiIn === undefined) {
      this.settings = easymidi.getInputs()[0];
    }
    return this.midiIn.name;
  }

  constructor() {}

  public close() {
    this.midiIn.close();
  }

  public getTime(): number {
    let elapsed = this.midiState.total + this.tcOffset;
    elapsed = elapsed % 86400000;
    return elapsed;
  }
}
