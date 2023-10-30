import { LogOrigin } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import { ClockInterface } from './Clock.js';
import { NtpTimeSync } from 'ntp-time-sync';

export class NtpClock implements ClockInterface {
  private offset = 0;
  private ntpServer: NtpTimeSync;
  public tcOffset: number = 0;
  private readonly interval;
  private _settings: string[];
  constructor() {
    this.ntpServer = NtpTimeSync.getInstance({});

    this.ntpServer.getTime().then((result) => {
      console.log(result);
      this.offset = result.offset;
    });
    this.interval = setInterval(() => {
      this.ntpServer
        .getTime()
        .then((result) => {
          console.log(result);
          this.offset = result.offset;
        })
        .catch((error) => {
          console.log(LogOrigin.Server, `NTP CLock: ${error}`);
        });
    }, 128000);
    //TODO: implement dynamic interval based of result.precision
    //but keep KoD in mind https://community.ntppool.org/t/kod-is-it-something-to-avoid-in-the-server-configuration-or-still-useful/1828
  }

  public set settings(v: string) {
    this._settings = v.replaceAll(' ', '').split(',');
    console.log(LogOrigin.Server, `CLOCK: NTP: ${this._settings}`);

    this.ntpServer = NtpTimeSync.getInstance({ servers: this._settings });
    this.ntpServer.getTime().then((result) => {
      console.log(result);
      this.offset = result.offset;
    });
  }

  public get settings(): string {
    if (this._settings === undefined) {
      //TODO: this is not allowed as per https://www.ntppool.org/vendors.html
      this.settings = '0.pool.ntp.org,1.pool.ntp.org,2.pool.ntp.org,3.pool.ntp.org';
    }
    return;
  }

  public close() {
    clearInterval(this.interval);
  }

  public getTime(): number {
    const now = new Date();
    now.setUTCMilliseconds(now.getUTCMilliseconds() + this.offset);

    // extract milliseconds since midnight
    let elapsed = now.getHours() * 3600000;
    elapsed += now.getMinutes() * 60000;
    elapsed += now.getSeconds() * 1000;
    elapsed += now.getMilliseconds();
    elapsed += this.tcOffset;
    elapsed = elapsed % 86400000;
    return elapsed;
  }
}
