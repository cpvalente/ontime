import got from 'got';

import { HttpSettings, HttpSubscription, LogOrigin } from 'ontime-types';

import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { parseTemplateNested } from './integrationUtils.js';
import { logger } from '../../classes/Logger.js';

/**
 * @description Class contains logic towards outgoing HTTP communications
 * @class
 */
export class HttpIntegration implements IIntegration<HttpSubscription> {
  subscriptions: HttpSubscription[];
  enabled: boolean;

  constructor() {
    this.subscriptions = [];
    this.enabled = false;
  }

  /**
   * Initializes httpClient
   */
  init(config: HttpSettings) {
    const { subscriptions, enabledOut } = config;
    this.initSubscriptions(subscriptions);
    this.enabled = enabledOut;
  }

  initSubscriptions(subscriptions: HttpSubscription[]) {
    this.subscriptions = subscriptions;
  }

  dispatch(action: TimerLifeCycleKey, state?: object) {
    // noop
    if (!this.enabled) {
      return;
    }

    for (let i = 0; i < this.subscriptions.length; i++) {
      const { cycle, message, enabled } = this.subscriptions[i];
      if (cycle !== action || !enabled || !message) {
        continue;
      }

      const parsedMessage = parseTemplateNested(message, state || {});
      try {
        const parsedUrl = new URL(parsedMessage);
        this.emit(parsedUrl);
      } catch (error) {
        logger.error(LogOrigin.Tx, `HTTP Integration: ${error}`);
      }
    }
  }

  async emit(path: URL) {
    await got.get(path, {
      retry: { limit: 0 },
    });
  }

  shutdown() {
    /** shutdown is a no-op here*/
  }
}

export const httpIntegration = new HttpIntegration();
