import easymidi from 'easymidi';
import { ClockInterface } from './Clock.js';

export class MidiClock implements ClockInterface {
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

  constructor(inputIndex: number) {
    this.midiIn = new easymidi.Input(easymidi.getInputs()[inputIndex]);
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

  public getTime(): number {
    return this.midiState.total;
  }
}
