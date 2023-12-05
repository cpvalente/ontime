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
  // protected httpAgent: null | http.Agent;
  subscriptions: HttpSubscription;
  private retryCount = 0;
  constructor() {
    // this.httpAgent = null;
    this.subscriptions = dbModel.http.subscriptions;
  }

  /**
   * Initializes httpClient
   */
  init(config: HttpSettings) {
    const { subscriptions, enabledOut, retryCount } = config;

    this.retryCount = retryCount;

    if (!enabledOut) {
      // this.httpAgent?.destroy();
      return {
        success: false,
        message: 'HTTP output disabled',
      };
    }

    this.initSubscriptions(subscriptions);

    try {
      // this allows re-calling the init function during runtime
      // this.httpAgent?.destroy();
      // this.httpAgent = new http.Agent({ keepAlive: true, timeout: 2000 });
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
    // if (!this.httpAgent) {
    //   return {
    //     success: false,
    //     message: 'Client not initialised',
    //   };
    // }

    if (!action) {
      return {
        success: false,
        message: 'HTTP called with no action',
      };
    }

    // check subscriptions for action
    const eventSubscriptions = (this.subscriptions?.[action] as HttpSubscriptionOptions[]) || [];

    eventSubscriptions.forEach((sub) => {
      const { enabled, url, options, method } = sub;
      if (enabled && url) {
        const templateUrl = parseTemplateNested(url, state || {});
        const templateOptions = parseTemplateNested(options, state || {});
        try {
          this.emit(templateUrl, templateOptions, method);
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

  async emit(path: string, options: string, method: 'GET' | 'POST') {
    try {
      if (method === 'GET') {
        await got.get(path, {
          searchParams: options,
          retry: { limit: this.retryCount },
        });
      } else if (method === 'POST') {
        await got.post(path, {
          body: options,
          retry: { limit: this.retryCount },
        });
      }
    } catch (err) {
      logger.error(LogOrigin.Tx, `HTTP integration: ${err}`);
    }
    // http
    //   .get(path, { agent: this.httpAgent }, (res) => {
    //     if (res.statusCode !== 200) {
    //       logger.error(LogOrigin.Tx, `HTTP Error: ${res.statusCode}`);
    //     }
    //     res.resume();
    //   })
    //   .on('error', (err) => {
    //     logger.error(LogOrigin.Tx, `HTTP integration: ${err}`);
    //   });
  }

  shutdown() {
    // if (this.httpAgent) {
    //   this.httpAgent?.destroy();
    //   this.httpAgent = null;
    // }
  }
}

export const httpIntegration = new HttpIntegration();
