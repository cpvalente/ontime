import { LogOrigin } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import { ClockInterface } from './Clock.js';
import { NtpTimeSync } from 'ntp-time-sync';
import { dayInMs, mth, mtm, mts } from 'ontime-utils';
import { millisToSeconds } from '../utils/time.js';

export class NtpClock implements ClockInterface {
  private ntpOffset = 0;
  private activeOffset = 0;
  private ntpServer: NtpTimeSync;
  public tcOffset: number = 0;
  private readonly adjustAmount = 10; // 10 ms
  private readonly maxInterval = 10 * mtm; // 10 minutes
  private readonly minInterval = 3 * mts; // 3 seconds

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
        this.ntpOffset = result.offset;
      })
      .catch((error) => {
        logger.info(LogOrigin.Server, `NTP CLock: ${error}`);
      });

    const diff = Math.abs(this.ntpOffset - this.activeOffset);
    const direction = Math.sign(this.ntpOffset - this.activeOffset);
    const nextUpdate = Math.max(this.maxInterval - 10 * diff, this.minInterval);
    if (diff < mts) {
      logger.info(LogOrigin.Server, `NTP CLock: offset < 1 sec. Next sync in ${millisToSeconds(nextUpdate)} sec.`);
    } else if (diff < mtm) {
      logger.info(
        LogOrigin.Server,
        `NTP CLock: offset ${millisToSeconds(direction * diff)} sec. Next sync in ${millisToSeconds(nextUpdate)} sec.`,
      );
    } else {
      logger.info(
        LogOrigin.Server,
        `NTP CLock: offset ${Math.ceil(millisToSeconds(direction * diff) / 60)} min. Next sync in ${millisToSeconds(
          nextUpdate,
        )} sec.`,
      );
    }
    this.activeOffset += direction * Math.min(diff, this.adjustAmount);
    setTimeout(() => {
      this.updateNtp();
    }, nextUpdate);
  }

  public set settings(v: string) {
    this._settings = v.replaceAll(' ', '').split(',');
    logger.info(LogOrigin.Server, `CLOCK: NTP: ${this._settings}`);

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
    let elapsed = now.getHours() * mth;
    elapsed += now.getMinutes() * mtm;
    elapsed += now.getSeconds() * mts;
    elapsed += now.getMilliseconds();
    elapsed += this.tcOffset;
    elapsed = elapsed % dayInMs;
    return elapsed;
  }
}
