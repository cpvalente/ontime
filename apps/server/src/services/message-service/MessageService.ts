import { Message, TimerMessage } from 'ontime-types';

import { throttle } from '../../utils/throttle.js';

import type { PublishFn } from '../../stores/EventStore.js';

let instance;

class MessageService {
  timerMessage: TimerMessage;
  publicMessage: Message;
  lowerMessage: Message;
  externalMessage: Message;

  private throttledSet: PublishFn;
  private publish: PublishFn | null;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;

    this.timerMessage = {
      text: '',
      visible: false,
      blink: false,
      blackout: false,
    };

    this.publicMessage = {
      text: '',
      visible: false,
    };

    this.lowerMessage = {
      text: '',
      visible: false,
    };

    this.externalMessage = {
      text: '',
      visible: false,
    };

    this.throttledSet = () => {
      throw new Error('Published called before initialisation');
    };
  }

  init(publish: PublishFn) {
    this.publish = publish;
    this.throttledSet = throttle((key, value) => this.publish(key, value), 100);
  }

  /**
   * @description patches the External Message object
   */
  setExternalMessage(payload: Partial<Message>) {
    this.externalMessage = { ...this.externalMessage, ...payload };
    this.throttledSet('externalMessage', this.externalMessage);
    return this.getAll();
  }

  /**
   * @description patches the Timer Message object
   */
  setTimerMessage(payload: Partial<TimerMessage>) {
    this.timerMessage = { ...this.timerMessage, ...payload };
    this.throttledSet('timerMessage', this.timerMessage);
    return this.getAll();
  }

  /**
   * @description patches the Public Message object
   */
  setPublicMessage(payload: Partial<Message>) {
    this.publicMessage = { ...this.publicMessage, ...payload };
    this.throttledSet('publicMessage', this.publicMessage);
    return this.getAll();
  }

  /**
   * @description patches the Lower Message object
   */
  setLowerMessage(payload: Partial<Message>) {
    this.lowerMessage = { ...this.lowerMessage, ...payload };
    this.throttledSet('lowerMessage', this.lowerMessage);
    return this.getAll();
  }

  /**
   * @description Returns feature data
   */
  getAll() {
    return {
      timerMessage: this.timerMessage,
      publicMessage: this.publicMessage,
      lowerMessage: this.lowerMessage,
      externalMessage: this.externalMessage,
    };
  }
}

export const messageService = new MessageService();

/**
 * Asserts whether an object is a valid TimerMessage patch
 * @param obj - object to evaluate
 * @returns boolean
 */
export function isPartialTimerMessage(obj: any): obj is Partial<TimerMessage> {
  return (
    obj &&
    typeof obj === 'object' &&
    (typeof obj.text === 'string' || obj.text === undefined) &&
    (typeof obj.visible === 'boolean' || obj.visible === undefined) &&
    (typeof obj.blink === 'boolean' || obj.timerBlink === undefined) &&
    (typeof obj.blackout === 'boolean' || obj.timerBlackout === undefined)
  );
}
