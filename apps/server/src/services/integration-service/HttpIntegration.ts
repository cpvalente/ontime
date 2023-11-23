//TODO: cleanup stuff left over from OSC copy
import http from 'node:http';
import { HTTPSettings, LogOrigin, Subscription } from 'ontime-types';

import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { parseTemplateNested } from './integrationUtils.js';
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
    const { subscriptions, enabledOut } = config;

    if (!enabledOut) {
      return {
        success: true,
        message: `HTTP integration client disabled`,
      };
    }

    this.initSubscriptions(subscriptions);

    try {
      // this allows re-calling the init function during runtime
      this.httpAgent?.destroy();
      // this.httpAgent = new http.Agent({ keepAlive: true, timeout: 2000, maxSockets: 5, maxFreeSockets: 40 });
      //TODO: find the correct settings
      // this.httpAgent = new http.Agent({ keepAlive: true, timeout: 1000, maxFreeSockets: 10, maxSockets: 5});
      this.httpAgent = new http.Agent({ keepAlive: false, timeout: 1000 });
      // this.httpAgent = new http.Agent();
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
          if (parsedUrl.protocol !== 'http:') {
            logger.error(LogOrigin.Tx, `HTTP Integration: Only HTTP allowed, got ${parsedUrl.protocol}`);
            return {
              success: false,
              message: `Only HTTP allowed, got ${parsedUrl.protocol}`,
            };
          }
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
    http
      .get(path, { agent: this.httpAgent }, (res) => {
        if (res.statusCode !== 200) {
          logger.error(LogOrigin.Tx, `HTTP Error: ${res.statusCode}`);
        }
        res.resume();
      })
      .on('error', (err) => {
        logger.error(LogOrigin.Tx, `HTTP integration: ${err}`);
      });
  }

  shutdown() {
    if (this.httpAgent) {
      this.httpAgent?.destroy();
      this.httpAgent = null;
    }
  }
}

export const httpIntegration = new HttpIntegration();
