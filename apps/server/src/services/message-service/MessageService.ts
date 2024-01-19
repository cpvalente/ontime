import { Message, TimerMessage } from 'ontime-types';

import { throttle } from '../../utils/throttle.js';

import type { PublishFn } from '../../stores/EventStore.js';

let instance;

class MessageService {
  message: { timer: TimerMessage; public: Message; lower: Message; external: Message };

  private throttledSet: PublishFn;
  private publish: PublishFn | null;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;
    this.message = {
      timer: {
        text: '',
        visible: false,
        blink: false,
        blackout: false,
      },
      public: {
        text: '',
        visible: false,
      },
      lower: {
        text: '',
        visible: false,
      },
      external: {
        text: '',
        visible: false,
      },
    };

    this.throttledSet = () => {
      throw new Error('Published called before initialisation');
    };
  }

  init(publish: PublishFn) {
    this.publish = publish;
    this.throttledSet = throttle((key, value) => this.publish(key, value), 100);
  }

  setAll(
    message: Partial<{
      timer: TimerMessage;
      public: Message;
      lower: Message;
      external: Message;
    }>,
  ) {
    //TODO: is there a nicer way to spread nested objects
    this.message.timer = { ...this.message.timer, ...message?.timer };
    this.message.public = { ...this.message.public, ...message?.public };
    this.message.lower = { ...this.message.lower, ...message?.lower };
    this.message.external = { ...this.message.external, ...message?.external };

    this.throttledSet('message', this.message);
    return this.message;
  }
}

export const messageService = new MessageService();
