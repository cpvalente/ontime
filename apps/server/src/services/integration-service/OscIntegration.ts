import { ArgumentType, Client, Message } from 'node-osc';
import { OSCSettings, OscSubscription, OscSubscriptionOptions } from 'ontime-types';

import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { parseTemplateNested } from './integrationUtils.js';
import { isObject } from '../../utils/varUtils.js';
import { dbModel } from '../../models/dataModel.js';
import { validateOscSubscriptionObject } from '../../utils/parserFunctions.js';

type Action = TimerLifeCycleKey | string;

/**
 * @description Class contains logic towards outgoing OSC communications
 * @class
 */
export class OscIntegration implements IIntegration<OscSubscriptionOptions> {
  protected oscClient: null | Client;
  subscriptions: OscSubscription;

  constructor() {
    this.oscClient = null;
    this.subscriptions = dbModel.osc.subscriptions;
  }

  /**
   * Initializes oscClient
   */
  init(config: OSCSettings) {
    const { targetIP, portOut, subscriptions, enabledOut } = config;

    if (!enabledOut) {
      this.oscClient?.close();
      return {
        success: false,
        message: 'OSC output disabled',
      };
    }

    this.initSubscriptions(subscriptions);

    // runtime validation
    const validateType = typeof targetIP !== 'string' || typeof portOut !== 'number';
    const validateNull = !targetIP || !portOut;

    if (validateType || validateNull) {
      return {
        success: false,
        message: 'Config options incorrect',
      };
    }
    try {
      // this allows re-calling the init function during runtime
      this.oscClient?.close();
      this.oscClient = new Client(targetIP, portOut);
      return {
        success: true,
        message: `OSC integration client connected to ${targetIP}:${portOut}`,
      };
    } catch (error) {
      this.oscClient = null;
      return {
        success: false,
        message: `Failed initialising OSC Client: ${error}`,
      };
    }
  }

  initSubscriptions(subscriptionOptions: OscSubscription) {
    if (validateOscSubscriptionObject(subscriptionOptions)) {
      this.subscriptions = { ...subscriptionOptions };
    }
  }

  dispatch(action: Action, state?: object) {
    if (!this.oscClient) {
      return {
        success: false,
        message: 'Client not initialised',
      };
    }

    if (!action) {
      return {
        success: false,
        message: 'OSC called with no action',
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

  emit(path: string, payload?: ArgumentType) {
    const message = new Message(path);
    if (payload) {
      try {
        if (isObject(payload)) {
          message.append(JSON.stringify(payload));
        } else {
          message.append(payload);
        }
      } catch (error) {
        console.log('OSC ERROR', error, payload);
      }
    }

    this.oscClient.send(message, (error) => {
      if (error) {
        return {
          success: false,
          message: `Error sending message: ${JSON.stringify(error)}`,
        };
      }
      return {
        success: true,
        message: 'OSC Message sent',
      };
    });
  }

  shutdown() {
    console.log('Shutting down OSC integration');
    if (this.oscClient) {
      this.oscClient?.close();
      this.oscClient = null;
    }
  }
}

export const oscIntegration = new OscIntegration();
