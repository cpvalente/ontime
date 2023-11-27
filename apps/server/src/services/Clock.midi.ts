import { LogOrigin } from 'ontime-types';
import { Input } from '@julusian/midi';
import { ClockInterface } from './Clock.js';
import { logger } from '../classes/Logger.js';
import { dayInMs, mth, mtm, mts } from 'ontime-utils';

export class MidiClock implements ClockInterface {
  private readonly midiIn: Input;
  private readonly midiBuffer = new Array<number>(8).fill(-1);
  private currentMs: number = 0;
  private fps: number = 0;
  public tcOffset: number = 0;

  //TODO: settings
  public set settings(v: string) {
    this.midiIn.closePort();
    this.midiIn.openPort(0);
    logger.info(LogOrigin.Server, `CLOCK: MTC: Source is now ${this.midiIn.getPortName(0)}`);
    this.midiIn.ignoreTypes(false, false, true);
    this.midiIn.on('message', (_, message) => {
      if (message[0] === 241) {
        const index = message[1] >> 4;
        this.midiBuffer[index] = message[1] & 0x0f;
        if (index == 7) {
          const h = (this.midiBuffer[7] & 0x01) * 16 + this.midiBuffer[6];
          const m = this.midiBuffer[5] * 16 + this.midiBuffer[4];
          const s = this.midiBuffer[3] * 16 + this.midiBuffer[2];
          const f = this.midiBuffer[1] * 16 + this.midiBuffer[0];
          this.fps = [24, 25, 29.97, 30][this.midiBuffer[7] >> 1];
          if (!this.midiBuffer.findIndex((v) => v < 0)) {
            // if we dont have all fileds we cant calculate the time
            return;
          }
          this.currentMs = h * mth + m * mtm + s * mts + (f / this.fps) * mts;
          this.midiBuffer.fill(-1);
        }
      } else if (message[0] === 240) {
        this.midiBuffer.fill(-1);
        this.fps = [24, 25, 29.97, 30][message[5] >> 5];
        this.currentMs =
          (message[5] & 0x1f) * 3600000 + message[6] * 60000 + message[7] * 1000 + (message[8] / this.fps) * 1000;
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
    elapsed = elapsed % dayInMs;
    return elapsed;
  }
}
