import got from 'got';

import { HttpSettings, HttpSubscription, HttpSubscriptionOptions, LogOrigin } from 'ontime-types';

import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { parseTemplateNested } from './integrationUtils.js';
import { dbModel } from '../../models/dataModel.js';
import { logger } from '../../classes/Logger.js';
import { validateHttpSubscriptionObject } from '../../utils/parserFunctions.js';

type Action = TimerLifeCycleKey | string;

/**
 * @description Class contains logic towards outgoing HTTP communications
 * @class
 */
export class HttpIntegration implements IIntegration<HttpSubscriptionOptions> {
  subscriptions: HttpSubscription;
  constructor() {
    this.subscriptions = dbModel.http.subscriptions;
  }

  /**
   * Initializes httpClient
   */
  init(config: HttpSettings) {
    const { subscriptions, enabledOut } = config;

    if (!enabledOut) {
      return {
        success: false,
        message: 'HTTP output disabled',
      };
    }

    this.initSubscriptions(subscriptions);

    try {
      return {
        success: true,
        message: `HTTP integration client ready`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed initialising HTTP integration: ${error}`,
      };
    }
  }

  initSubscriptions(subscriptionOptions: HttpSubscription) {
    if (validateHttpSubscriptionObject(subscriptionOptions)) {
      this.subscriptions = { ...subscriptionOptions };
    }
  }

  dispatch(action: Action, state?: object) {
    if (!action) {
      return {
        success: false,
        message: 'HTTP called with no action',
      };
    }

    // check subscriptions for action
    const eventSubscriptions = this.subscriptions?.[action] || [];

    eventSubscriptions.forEach((sub) => {
      const { enabled, message } = sub;
      if (enabled && message) {
        const parsedMessage = parseTemplateNested(message, state || {});
        try {
          const parsedUrl = new URL(parsedMessage);
          this.emit(parsedUrl);
        } catch (err) {
          logger.error(LogOrigin.Tx, `HTTP Integration: ${err}`);
          return {
            success: false,
            message: `${err}`,
          };
        }
      }
    });
  }

  async emit(path: URL) {
    try {
      await got.get(path, {
        retry: { limit: 0 },
      });
    } catch (err) {
      logger.error(LogOrigin.Tx, `HTTP integration: ${err}`);
    }
  }

  shutdown() {}
}

export const httpIntegration = new HttpIntegration();
