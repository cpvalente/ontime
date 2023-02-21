import { ArgumentType, Client, Message } from 'node-osc';
import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { parseTemplate } from './integrationUtils.js';
import { isObject } from '../../utils/varUtils.js';
import { OSCSettings, OscSubscriptions } from '../../models/dataModel.js';

type Action = TimerLifeCycleKey | string;

/**
 * @description Class contains logic towards outgoing OSC communications
 * @class
 */
export class OscIntegration implements IIntegration {
  protected oscClient: null | Client;
  subscriptions: OscSubscriptions;

  constructor() {
    this.oscClient = null;
    this.subscriptions = {};
  }

  /**
   * Initializes oscClient
   */
  init(config: OSCSettings) {
    const { targetIP, portOut, subscriptions } = config;

    this.initSubscriptions(subscriptions);

    // runtime validation
    const validateType = typeof targetIP !== 'string' || typeof portOut !== 'number';
    const validateNull = !targetIP || !portOut;

    if (validateType || validateNull) {
      return {
        success: false,
        message: `Config options incorrect`,
      };
    }
    try {
      this.oscClient = new Client(targetIP, portOut);
      return {
        success: true,
        message: `OSC Client connected to ${targetIP}:${portOut}`,
      };
    } catch (error) {
      this.oscClient = null;
      return {
        success: false,
        message: `Failed initialising OSC Client: ${error}`,
      };
    }
  }

  initSubscriptions(subscriptionOptions: OscSubscriptions) {
    this.subscriptions = { ...this.subscriptions, ...subscriptionOptions };
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
    const { enabled, message } = this.subscriptions?.[action] || {};
    if (enabled) {
      const parsedMessage = parseTemplate(message, state || {});
      this.emit('address/', parsedMessage);
    }
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
          message: `error is here ${JSON.stringify(error)}`,
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
