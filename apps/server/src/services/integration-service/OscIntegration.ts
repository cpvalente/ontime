import { ArgumentType, Client, Message } from 'node-osc';
import { LogOrigin, MaybeNumber, MaybeString, OSCSettings, OscSubscription } from 'ontime-types';

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
  targetIP: MaybeString;
  portOut: MaybeNumber;
  enabledOut: boolean;

  constructor() {
    this.oscClient = null;
    this.subscriptions = [];
    this.targetIP = null;
    this.portOut = null;
    this.enabledOut = false;
  }

  /**
   * Initializes oscClient
   */
  init(config: OSCSettings) {
    const { targetIP, portOut, subscriptions, enabledOut } = config;
    this.initSubscriptions(subscriptions);

    if (!enabledOut && this.enabledOut) {
      this.targetIP = targetIP;
      this.portOut = portOut;
      this.enabledOut = enabledOut;
      this.shutdown();
      return;
    }

    if (this.oscClient && targetIP === this.targetIP && portOut === this.portOut) {
      // nothing changed that would mean we need a new client
      return;
    }

    this.targetIP = targetIP;
    this.portOut = portOut;
    this.enabledOut = enabledOut;

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
    if (!this.oscClient) {
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
    logger.info(LogOrigin.Tx, 'Shutting down OSC integration');
    if (this.oscClient) {
      this.oscClient?.close();
      this.oscClient = null;
    }
  }
}

export const oscIntegration = new OscIntegration();
