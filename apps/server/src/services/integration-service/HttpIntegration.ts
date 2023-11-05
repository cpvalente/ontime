//TODO: cleanup stuff left over from OSC copy
import http from 'node:http';
import { HTTPSettings, LogOrigin, Subscription } from 'ontime-types';

import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { parseTemplateNested } from './integrationUtils.js';
import { isObject } from '../../utils/varUtils.js';
import { dbModel } from '../../models/dataModel.js';
import { validateHttpObject } from '../../utils/parserFunctions.js';
import { logger } from '../../classes/Logger.js';

import { URL } from 'node:url';

type Action = TimerLifeCycleKey | string;

/**
 * @description Class contains logic towards outgoing HTTP communications
 * @class
 */
export class HttpIntegration implements IIntegration {
  protected httpAgent: null | http.Agent;
  subscriptions: Subscription;

  constructor() {
    this.httpAgent = null;
    this.subscriptions = dbModel.http.subscriptions;
  }

  /**
   * Initializes httpClient
   */
  init(config: HTTPSettings) {
    const { subscriptions } = config;

    this.initSubscriptions(subscriptions);

    try {
      // this allows re-calling the init function during runtime
      this.httpAgent?.destroy();
      // this.httpAgent = new http.Agent({ keepAlive: true, timeout: 2000, maxSockets: 5, maxFreeSockets: 40 });
      //TODO: find the correct settings
      this.httpAgent = new http.Agent({ keepAlive: true, timeout: 1000, maxFreeSockets: 1, maxSockets: 1});
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

  initSubscriptions(subscriptionOptions: Subscription) {
    if (validateHttpObject(subscriptionOptions)) {
      this.subscriptions = { ...subscriptionOptions };
    }
  }

  dispatch(action: Action, state?: object) {
    if (!this.httpAgent) {
      return {
        success: false,
        message: 'Client not initialised',
      };
    }

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
        }
      }
    });
  }

  emit(path: URL) {
    http
      .get(path, { agent: this.httpAgent }, (res) => {
        if (res.statusCode < 300) {
          res.resume();
          return {
            success: true,
            message: 'HTTP Message sent',
          };
        } else {
          res.resume();
          return {
            success: false,
            message: `Error sending message responds: ${res.statusCode}`,
          };
        }
      })
      .on('error', (err) => {
        logger.error(LogOrigin.Tx, `HTTP integration: ${err}`);
      });
  }

  shutdown() {
    console.log('Shutting down HTTP integration');
    if (this.httpAgent) {
      this.httpAgent?.destroy();
      this.httpAgent = null;
    }
  }
}

export const httpIntegration = new HttpIntegration();
