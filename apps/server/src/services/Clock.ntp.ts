import { LogOrigin } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import { ClockInterface } from './Clock.js';
import { NtpTimeSync } from 'ntp-time-sync';
import { dayInMs } from 'ontime-utils';

export class NtpClock implements ClockInterface {
  private ntpOffset = 0;
  private activeOffset = 10 * 60 * 1000;
  private ntpServer: NtpTimeSync;
  public tcOffset: number = 0;
  private readonly adjustAmount = 10;
  private readonly maxInterval = 10 * 60 * 1000; // 10 minutes
  private readonly minInterval = 3000; // 3 seconds

  private _settings: string[];
  constructor() {
    this.ntpServer = NtpTimeSync.getInstance({});

    setTimeout(() => {
      this.updateNtp();
    }, 5000);
  }

  private async updateNtp() {
    await this.ntpServer
      .getTime(false)
      .then((result) => {
        console.log(result);
        this.ntpOffset = result.offset;
      })
      .catch((error) => {
        logger.info(LogOrigin.Server, `NTP CLock: ${error}`);
      });

    const diff = Math.abs(this.ntpOffset - this.activeOffset);
    const direction = Math.sign(this.ntpOffset - this.activeOffset)
    const nextUpdate = Math.max(this.maxInterval - 10 * diff, this.minInterval);
    console.log(`active: ${this.activeOffset}, addust amount: ${direction * Math.min(diff, this.adjustAmount)}, next: ${nextUpdate}`);
    this.activeOffset += (direction * Math.min(diff, this.adjustAmount));
    setTimeout(() => {
      this.updateNtp();
    }, 5000);
    //TODO: implement dynamic interval based of result.precision
    //but keep KoD in mind https://community.ntppool.org/t/kod-is-it-something-to-avoid-in-the-server-configuration-or-still-useful/1828
  }

  public set settings(v: string) {
    this._settings = v.replaceAll(' ', '').split(',');
    console.log(LogOrigin.Server, `CLOCK: NTP: ${this._settings}`);

    this.ntpServer = NtpTimeSync.getInstance({ servers: this._settings });
  }

  public get settings(): string {
    if (this._settings === undefined) {
      //TODO: this is not allowed as per https://www.ntppool.org/vendors.html
      this.settings = '0.pool.ntp.org,1.pool.ntp.org,2.pool.ntp.org,3.pool.ntp.org';
    }
    return;
  }

  public close() {}

  public getTime(): number {
    const now = new Date();
    now.setUTCMilliseconds(now.getUTCMilliseconds() + this.activeOffset);

    // extract milliseconds since midnight
    let elapsed = now.getHours() * 3600000;
    elapsed += now.getMinutes() * 60000;
    elapsed += now.getSeconds() * 1000;
    elapsed += now.getMilliseconds();
    elapsed += this.tcOffset;
    elapsed = elapsed % dayInMs;
    return elapsed;
  }
}
