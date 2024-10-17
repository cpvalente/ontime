import got from 'got';

import { CompanionSettings, CompanionSubscription, LogOrigin, MaybeNumber, MaybeString } from 'ontime-types';

import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
// import { parseTemplateNested } from './integrationUtils.js';
import { logger } from '../../classes/Logger.js';

/**
 * @description Class contains logic towards outgoing Companion communications
 * @class
 */
export class CompanionIntegration implements IIntegration<CompanionSubscription, CompanionSettings> {
  subscriptions: CompanionSubscription[];
  enabledOut: boolean;
  targetIP: MaybeString;
  portOut: MaybeNumber;

  constructor() {
    this.subscriptions = [];
    this.enabledOut = false;
    this.targetIP = null;
    this.portOut = null;
  }

  /**
   * Initializes companionClient
   */
  init(config: CompanionSettings) {
    const { subscriptions, enabledOut, portOut, targetIP } = config;
    this.initSubscriptions(subscriptions);
    this.enabledOut = enabledOut;
    this.portOut = portOut;
    this.targetIP = targetIP;
  }

  initSubscriptions(subscriptions: CompanionSubscription[]) {
    this.subscriptions = subscriptions;
  }

  dispatch(trigger: TimerLifeCycleKey, _state?: object) {
    // noop
    if (!this.enabledOut) {
      return;
    }

    for (let i = 0; i < this.subscriptions.length; i++) {
      const { cycle, page, row, column, action, enabled } = this.subscriptions[i];
      if (cycle !== trigger || !enabled) {
        continue;
      }
      const url = `http://${this.targetIP}:${this.portOut}/api/location/${page}/${row}/${column}/${action}`;
      // const parsedMessage = parseTemplateNested(message, state || {});
      this.emit(url);
    }
  }

  emit(path: string) {
    got.post(path, { retry: { limit: 0 } }).catch((err) => {
      logger.warning(LogOrigin.Tx, `Companioin Integration: ${err.message}`);

      if (err.code === 'ECONNREFUSED') {
        logger.warning(LogOrigin.Tx, `Companioin Integration: '${err.code}' The server refused the connection`);
        return;
      }

      if (err.code === 'ENOTFOUND') {
        logger.warning(LogOrigin.Tx, `Companioin Integration: '${err.code}' DNS lookup failed`);
        return;
      }

      if (err.code === 'ETIMEDOUT') {
        logger.warning(LogOrigin.Tx, `Companioin Integration: '${err.code}' The connection timed out`);
        return;
      }

      logger.warning(LogOrigin.Tx, `Companioin Integration: ${err.code}`);
    });
  }

  shutdown() {
    /** shutdown is a no-op here*/
  }
}

export const companionIntegration = new CompanionIntegration();
