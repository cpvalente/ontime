import { Message } from 'ontime-types';

import { eventStore } from '../../stores/EventStore.js';
import { TimerMessage } from 'ontime-types/src/definitions/runtime/MessageControl.type.js';

let instance;

class MessageService {
  timerMessage: TimerMessage;
  publicMessage: Message;
  lowerMessage: Message;
  externalMessage: Message;
  onAir: boolean;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;

    this.timerMessage = {
      text: '',
      visible: false,
      timerBlink: false,
      timerBlackout: false,
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

    this.onAir = false;
  }

  /**
   * @description sets message on stage timer screen
   */
  setExternalText(payload: string) {
    this.externalMessage.text = payload;
    eventStore.set('externalMessage', this.externalMessage);
    return this.getAll();
  }

  /**
   * @description sets message visibility on stage timer screen
   */
  setExternalVisibility(status: boolean) {
    this.externalMessage.visible = status;
    eventStore.set('externalMessage', this.externalMessage);
    return this.getAll();
  }

  /**
   * @description sets message on stage timer screen
   */
  setTimerText(payload: string) {
    this.timerMessage.text = payload;
    eventStore.set('timerMessage', this.timerMessage);
    return this.getAll();
  }

  /**
   * @description sets message visibility on stage timer screen
   */
  setTimerVisibility(status: boolean) {
    this.timerMessage.visible = status;
    eventStore.set('timerMessage', this.timerMessage);
    return this.getAll();
  }

  /**
   * @description sets message on public screen
   */
  setPublicText(payload: string) {
    this.publicMessage.text = payload;
    eventStore.set('publicMessage', this.publicMessage);
    return this.getAll();
  }

  /**
   * @description sets message visibility on public screen
   */
  setPublicVisibility(status: boolean) {
    this.publicMessage.visible = status;
    eventStore.set('publicMessage', this.publicMessage);
    return this.getAll();
  }

  /**
   * @description sets message on lower third screen
   */
  setLowerText(payload: string) {
    this.lowerMessage.text = payload;
    eventStore.set('lowerMessage', this.lowerMessage);
    return this.getAll();
  }

  /**
   * @description sets message visibility on lower third screen
   */
  setLowerVisibility(status: boolean) {
    this.lowerMessage.visible = status;
    eventStore.set('lowerMessage', this.lowerMessage);
    return this.getAll();
  }

  /**
   * @description set state of onAir, toggles if parameters are offered
   */
  setOnAir(status?: boolean) {
    if (typeof status === 'undefined') {
      this.onAir = !this.onAir;
    } else {
      this.onAir = status;
    }
    eventStore.set('onAir', this.onAir);
    return this.getAll();
  }

  /**
   * @description set state of timer blink, toggles if parameters are offered
   */

  setTimerBlink(status?: boolean) {
    if (typeof status === 'undefined') {
      this.timerMessage.timerBlink = !this.timerMessage.timerBlink;
    } else {
      this.timerMessage.timerBlink = status;
    }
    eventStore.set('timerMessage', this.timerMessage);
    return this.getAll();
  }

  /**
   * @description set state of timer blackout, toggles if parameters are offered
   */

  setTimerBlackout(status?: boolean) {
    if (typeof status === 'undefined') {
      this.timerMessage.timerBlackout = !this.timerMessage.timerBlackout;
    } else {
      this.timerMessage.timerBlackout = status;
    }
    eventStore.set('timerMessage', this.timerMessage);
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
      onAir: this.onAir,
    };
  }
}

export const messageService = new MessageService();
