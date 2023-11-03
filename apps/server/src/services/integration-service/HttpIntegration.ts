//TODO: cleanup stuff left over from OSC copy
import http from 'node:http';
import { HTTPSettings, Subscription } from 'ontime-types';

import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { parseTemplateNested } from './integrationUtils.js';
import { isObject } from '../../utils/varUtils.js';
import { dbModel } from '../../models/dataModel.js';
import { validateHttpObject } from '../../utils/parserFunctions.js';

type Action = TimerLifeCycleKey | string;

/**
 * @description Class contains logic towards outgoing HTTP communications
 * @class
 */
export class HttpIntegration implements IIntegration {
  subscriptions: Subscription;

  constructor() {
    // this.httpClient = null;
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
      // this.httpClient?.close();
      return {
        success: true,
        message: `HTTP integration client}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed initialising HTTP: ${error}`,
      };
    }
  }

  initSubscriptions(subscriptionOptions: Subscription) {
    if (validateHttpObject(subscriptionOptions)) {
      this.subscriptions = { ...subscriptionOptions };
    }
  }

  dispatch(action: Action, state?: object) {
    if (false) {
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
        this.emit(parsedMessage);
      }
    });
  }

  emit(path: string) {
    http.get(path, (res) => {
      if (res.statusCode < 300) {
        return {
          success: true,
          message: 'HTTP Message sent',
        };
      } else {
        return {
          success: false,
          message: `Error sending message responds: ${res.statusCode}`,
        };
      }
    });
  }

  shutdown() {
    console.log('Shutting down HTTP integration');
    // if (this.httpClient) {
    //   // this.httpClient?.close();
    //   this.httpClient = null;
    // }
  }
}

export const httpIntegration = new HttpIntegration();
