import { MessageControl } from 'ontime-types';

import { eventStore } from '../../stores/EventStore.js';

let instance;

class MessageService {
  messages: MessageControl;
  onAir: boolean;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;

    this.messages = {
      presenter: {
        text: '',
        visible: false,
      },
      public: {
        text: '',
        visible: false,
      },
      lower: {
        text: '',
        visible: false,
      },
    };
    this.onAir = false;
  }

  /**
   * @description sets message on stage timer screen
   */
  setTimerText(payload: string) {
    this.messages.presenter.text = payload;
    this.updateStore();
    return this.getAll();
  }

  /**
   * @description sets message visibility on stage timer screen
   */
  setTimerVisibility(status: boolean) {
    this.messages.presenter.visible = status;
    this.updateStore();
    return this.getAll();
  }

  /**
   * @description sets message on public screen
   */
  setPublicText(payload: string) {
    this.messages.public.text = payload;
    this.updateStore();
    return this.getAll();
  }

  /**
   * @description sets message visibility on public screen
   */
  setPublicVisibility(status: boolean) {
    this.messages.public.visible = status;
    this.updateStore();
    return this.getAll();
  }

  /**
   * @description sets message on lower third screen
   */
  setLowerText(payload: string) {
    this.messages.lower.text = payload;
    this.updateStore();
    return this.getAll();
  }

  /**
   * @description sets message visibility on lower third screen
   */
  setLowerVisibility(status: boolean) {
    this.messages.lower.visible = status;
    this.updateStore();
    return this.getAll();
  }

  /**
   * @description set state of onAir
   */
  setOnAir(status: boolean) {
    this.onAir = status;
    this.updateStore();
    return this.getAll();
  }

  private updateStore() {
    eventStore.set('messages', this.messages);
    eventStore.set('onAir', this.onAir);
  }

  /**
   * @description Returns feature data
   */
  getAll() {
    return {
      messages: this.messages,
      onAir: this.onAir,
    };
  }
}

export const messageService = new MessageService();
