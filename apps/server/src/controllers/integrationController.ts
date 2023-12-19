// skipcq: JS-C1003 - we like the API
import * as assert from '../utils/assert.js';
import { ONTIME_VERSION } from '../ONTIME_VERSION.js';

import { isPartialTimerMessage, messageService } from '../services/message-service/MessageService.js';
import { PlaybackService } from '../services/PlaybackService.js';
import { eventStore } from '../stores/EventStore.js';
import { parse, updateEvent } from './integrationController.config.js';

export type ChangeOptions = {
  eventId: string;
  property: string;
  value: unknown;
};

export function dispatchFromAdapter(
  type: string,
  args: {
    payload: unknown;
  },
  _source?: 'osc' | 'ws' | 'http',
) {
  const payload = args.payload;
  const action = type.toLowerCase();
  const handler = actionHandlers[action];
  if (handler) {
    return handler(payload);
  } else {
    throw new Error(`Unhandled message ${type}`);
  }
}

type ActionHandler = (payload: unknown) => { payload: unknown };

// TODO: add data to missing returns once available
const actionHandlers: Record<string, ActionHandler> = {
  /* General */
  'test-ontime': () => ({ payload: `Hello from Ontime version ${ONTIME_VERSION}` }),
  'ontime-poll': () => ({
    payload: eventStore.poll(),
  }),
  change: (payload) => {
    // WS: {type: 'change', payload: { eventId, property, value } }
    const { eventId, property, value } = payload as ChangeOptions;
    const { parsedPayload, parsedProperty } = parse(property, value);

    const updatedEvent = updateEvent(eventId, parsedProperty, parsedPayload);
    return { payload: updatedEvent };
  },
  /* Message Service */
  'set-timer-message': (payload) => {
    if (!isPartialTimerMessage(payload)) {
      throw new Error('Payload is not a valid timer message');
    }
    const newState = messageService.setTimerMessage(payload);
    return { payload: newState.timerMessage };
  },
  'set-timer-blink': (payload) => {
    assert.isDefined(payload);
    const newState = messageService.setTimerBlink(Boolean(payload));
    return { payload: newState.timerMessage };
  },
  'set-timer-blackout': (payload) => {
    assert.isDefined(payload);
    const newState = messageService.setTimerBlackout(Boolean(payload));
    return { payload: newState.timerMessage };
  },
  'set-timer-message-text': (payload) => {
    assert.isString(payload);
    const newState = messageService.setTimerText(payload);
    return { payload: newState.timerMessage };
  },
  'set-timer-message-visible': (payload) => {
    assert.isDefined(payload);
    const newState = messageService.setTimerVisibility(Boolean(payload));
    return { payload: newState.timerMessage };
  },
  'set-public-message-text': (payload) => {
    assert.isString(payload);
    const newState = messageService.setPublicText(payload);
    return { payload: newState.publicMessage };
  },
  'set-public-message-visible': (payload) => {
    assert.isDefined(payload);
    const newState = messageService.setPublicVisibility(Boolean(payload));
    return { payload: newState.publicMessage };
  },
  'set-lower-message-text': (payload) => {
    assert.isString(payload);
    const newState = messageService.setLowerText(payload);
    return { payload: newState.lowerMessage };
  },
  'set-lower-message-visible': (payload) => {
    assert.isDefined(payload);
    const newState = messageService.setLowerVisibility(Boolean(payload));
    return { payload: newState.lowerMessage };
  },
  'set-external-message-text': (payload) => {
    assert.isString(payload);
    const newState = messageService.setExternalText(payload);
    return { payload: newState.externalMessage };
  },
  'set-external-message-visible': (payload) => {
    assert.isDefined(payload);
    const newState = messageService.setExternalVisibility(Boolean(payload));
    return { payload: newState.externalMessage };
  },
  /* Playback */
  start: (payload) => {
    if (payload && typeof payload === 'object') {
      if ('index' in payload) {
        const reply = actionHandlers.startindex(payload.index);
        return reply;
      }
      if ('id' in payload) {
        const reply = actionHandlers.startid(payload.id);
        return reply;
      }
      if ('cue' in payload) {
        const reply = actionHandlers.startcue(payload.cue);
        return reply;
      }
    }

    PlaybackService.start();

    return { payload: 'start' };
  },
  'start-next': () => {
    PlaybackService.startNext();
    return { payload: 'start' };
  },
  startindex: (payload) => {
    const eventIndex = numberOrError(payload);
    if (eventIndex <= 0) {
      throw new Error(`Event index out of range ${eventIndex}`);
    }

    // Indexes in frontend are 1 based
    PlaybackService.startByIndex(eventIndex - 1);
    return { payload: 'success' };
  },
  startid: (payload) => {
    assert.isString(payload);
    PlaybackService.startById(payload);
    return { payload: 'success' };
  },
  startcue: (payload) => {
    assert.isString(payload);
    PlaybackService.startByCue(payload);
    return { payload: 'success' };
  },
  pause: () => {
    PlaybackService.pause();
    return { payload: 'success' };
  },
  previous: () => {
    PlaybackService.loadPrevious();
    return { payload: 'success' };
  },
  next: () => {
    PlaybackService.loadNext();
    return { payload: 'success' };
  },
  stop: () => {
    PlaybackService.stop();
    return { payload: 'success' };
  },
  reload: () => {
    PlaybackService.reload();
    return { payload: 'success' };
  },
  roll: () => {
    PlaybackService.roll();
    return { payload: 'success' };
  },
  loadindex: (payload) => {
    const eventIndex = numberOrError(payload);
    if (eventIndex <= 0) {
      throw new Error(`Event index out of range ${eventIndex}`);
    }

    // Indexes in frontend are 1 based
    PlaybackService.loadByIndex(eventIndex - 1);
    return { payload: 'success' };
  },
  loadid: (payload) => {
    assert.isDefined(payload);
    PlaybackService.loadById(payload.toString().toLowerCase());
    return { payload: 'success' };
  },
  loadcue: (payload) => {
    assert.isString(payload);
    PlaybackService.loadByCue(payload);
    return { payload: 'success' };
  },
  addtime: (payload) => {
    const time = numberOrError(payload);
    PlaybackService.addTime(time);
    return { payload: 'success' };
  },
};

/**
 * Returns a value of type number, converting if necessary
 * Otherwise throws
 * @param value
 * @returns number
 * @throws
 */
function numberOrError(value: unknown) {
  const converted = Number(value);
  if (isNaN(converted)) {
    throw new Error('Payload is not a valid number');
  }
  return converted;
}
