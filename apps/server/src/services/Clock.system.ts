import { ClockInterface } from './Clock.js';
export class SystemClock implements ClockInterface {
  constructor() {}

  public getTime(): number {
    const now = new Date();

    // extract milliseconds since midnight
    let elapsed = now.getHours() * 3600000;
    elapsed += now.getMinutes() * 60000;
    elapsed += now.getSeconds() * 1000;
    elapsed += now.getMilliseconds();
    return elapsed;
  }
}
