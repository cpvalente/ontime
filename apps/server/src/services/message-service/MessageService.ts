import { DeepPartial, Message, TimerMessage, MessageState } from 'ontime-types';

import { throttle } from '../../utils/throttle.js';

import type { PublishFn } from '../../stores/EventStore.js';

let instance: MessageService | null = null;

class MessageService {
  timer: TimerMessage;
  lower: Message;
  external: Message;

  private throttledSet: PublishFn;
  private publish: PublishFn | null;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;

    this.throttledSet = () => {
      throw new Error('Published called before initialisation');
    };

    this.clear();
  }

  clear() {
    this.timer = {
      text: '',
      visible: false,
      blink: false,
      blackout: false,
    };

    this.lower = {
      text: '',
      visible: false,
    };

    this.external = {
      text: '',
      visible: false,
    };
  }

  init(publish: PublishFn) {
    this.publish = publish;
    this.throttledSet = throttle((key, value) => this.publish?.(key, value), 100);
  }

  getState(): MessageState {
    return {
      timer: this.timer,
      lower: this.lower,
      external: this.external,
    };
  }

  patch(message: DeepPartial<MessageState>) {
    if (message.timer) this.timer = { ...this.timer, ...message.timer };
    if (message.lower) this.lower = { ...this.lower, ...message.lower };
    if (message.external) this.external = { ...this.external, ...message.external };

    const newState = this.getState();

    this.throttledSet('message', newState);
    return newState;
  }
}

export const messageService = new MessageService();
