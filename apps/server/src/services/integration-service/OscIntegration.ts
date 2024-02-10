import { ArgumentType, Client, Message } from 'node-osc';
import { LogOrigin, OSCSettings, OscSubscription } from 'ontime-types';

import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { parseTemplateNested } from './integrationUtils.js';
import { isObject } from '../../utils/varUtils.js';
import { logger } from '../../classes/Logger.js';

/**
 * @description Class contains logic towards outgoing OSC communications
 * @class
 */
export class OscIntegration implements IIntegration<OscSubscription> {
  protected oscClient: null | Client;
  subscriptions: OscSubscription[];

  constructor() {
    this.oscClient = null;
    this.subscriptions = [];
  }

  /**
   * Initializes oscClient
   */
  init(config: OSCSettings) {
    const { targetIP, portOut, subscriptions, enabledOut } = config;
    this.initSubscriptions(subscriptions);

    // this allows re-calling the init function during runtime
    this.oscClient?.close();
    if (!enabledOut) {
      logger.info(LogOrigin.Tx, 'OSC client closed');
      return;
    }

    try {
      this.oscClient = new Client(targetIP, portOut);
    } catch (error) {
      this.oscClient = null;
      throw new Error(`Failed initialising OSC client: ${error}`);
    }
    return `OSC integration client connected to ${targetIP}:${portOut}`;
  }

  initSubscriptions(subscriptions: OscSubscription[]) {
    this.subscriptions = subscriptions;
  }

  dispatch(action: TimerLifeCycleKey, state?: object) {
    // noop
    if (!this.oscClient || !action) {
      return;
    }

    for (let i = 0; i < this.subscriptions.length; i++) {
      const { cycle, message, enabled } = this.subscriptions[i];
      if (cycle !== action || !enabled || !message) {
        continue;
      }

      const parsedMessage = parseTemplateNested(message, state || {});
      try {
        this.emit(parsedMessage);
      } catch (error) {
        logger.error(LogOrigin.Tx, `OSC Integration: ${error}`);
      }
    }
  }

  emit(path: string, payload?: ArgumentType) {
    if (!this.oscClient) {
      return;
    }

    const message = new Message(path);
    if (payload) {
      if (isObject(payload)) {
        message.append(JSON.stringify(payload));
      } else {
        message.append(payload);
      }
    }

    this.oscClient.send(message);
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
