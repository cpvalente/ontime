import { LogOrigin } from 'ontime-types';
import { Input } from '@julusian/midi';
import { ClockInterface } from './Clock.js';

export class MidiClock implements ClockInterface {
  private readonly midiIn: Input;
  private readonly midiBuffer = new Array<number>(8).fill(0);
  private currentMs: number = 0;
  private fps: number = 0;
  public tcOffset: number = 0;

  //TODO: settings
  public set settings(v: string) {
    let index = 0;

    this.midiIn.closePort();
    this.midiIn.openPort(0);
    console.log(LogOrigin.Server, `CLOCK: MTC: Source is now ${this.midiIn.getPortName(0)}`);
    this.midiIn.ignoreTypes(true, false, true);
    this.midiIn.on('message', (deltaTime, message) => {
      if (message[0] === 241) {
        const index = message[1] >> 4;
        this.midiBuffer[index] = message[1] & 0x0f;
        if (index == 7) {
          const h = (this.midiBuffer[7] & 0x01) * 16 + this.midiBuffer[6];
          const m = this.midiBuffer[5] * 16 + this.midiBuffer[4];
          const s = this.midiBuffer[3] * 16 + this.midiBuffer[2];
          const f = this.midiBuffer[1] * 16 + this.midiBuffer[0];
          this.fps = [24, 25, 29.97, 30][this.midiBuffer[7] >> 1];
          this.currentMs = h * 3600000 + m * 60000 + s * 1000 + f / this.fps * 1000;
        }
      }
    });
  }

  public get settings(): string {
    return this.midiIn.getPortName(0);
  }

  constructor() {
    this.midiIn = new Input();
  }

  public close() {
    this.midiIn.closePort();
  }

  public getTime(): number {
    let elapsed = this.currentMs + this.tcOffset;
    elapsed = elapsed % 86400000;
    return elapsed;
  }
}
