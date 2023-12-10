import { ClockInterface } from './Clock.js';
import { SystemClockState } from 'ontime-types';

export class SystemClock implements ClockInterface {
  public feedbackCallback: (state: SystemClockState, message: string) => void;

  init() {
    this.feedbackCallback(SystemClockState.None, '');
  }
  public offset: number = 0;
  public close() {}

  public set settings(v: string) {}

  public get settings(): string {
    return '';
  }

  public getTime(): number {
    const now = new Date();

    // extract milliseconds since midnight
    let elapsed = now.getHours() * 3600000;
    elapsed += now.getMinutes() * 60000;
    elapsed += now.getSeconds() * 1000;
    elapsed += now.getMilliseconds();
    elapsed += this.offset;
    elapsed = elapsed % 86400000;
    return elapsed;
  }
}
