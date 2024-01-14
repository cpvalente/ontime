// skipcq: JS-C1003 - we like the API
import * as assert from '../utils/assert.js';
import { ONTIME_VERSION } from '../ONTIME_VERSION.js';

import { isPartialMessage, isPartialTimerMessage, messageService } from '../services/message-service/MessageService.js';
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
  version: () => ({ payload: ONTIME_VERSION }),
  poll: () => ({
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
  //TODO: maybe coerce the boolean values
  message: (payload) => {
    if (payload && typeof payload === 'object') {
      if ('timer' in payload) {
        if (!isPartialTimerMessage(payload)) {
          throw new Error('Payload is not a valid timer message');
        }
        const newState = messageService.setTimerMessage(payload.timer);
        return { payload: newState.timerMessage };
      }
      if ('public' in payload) {
        if (!isPartialMessage(payload)) {
          throw new Error('Payload is not a valid public message');
        }
        const newState = messageService.setPublicMessage(payload);
        return { payload: newState.timerMessage };
      }
      if ('lower' in payload) {
        if (!isPartialMessage(payload)) {
          throw new Error('Payload is not a valid lower message');
        }
        const newState = messageService.setLowerMessage(payload);
        return { payload: newState.timerMessage };
      }
      if ('external' in payload) {
        if (!isPartialMessage(payload)) {
          throw new Error('Payload is not a valid external message');
        }
        const newState = messageService.setExternalMessage(payload);
        return { payload: newState.timerMessage };
      }
    }
    throw new Error('No message destination provided');
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
  startnext: () => {
    PlaybackService.startNext();
    return { payload: 'start' };
  },
  startindex: (payload) => {
    const eventIndex = numberOrError(payload);
    if (eventIndex <= 0) {
      throw new Error(`Event index out of range ${eventIndex}`);
    }

    // Indexes in frontend are 1 based
    const success = PlaybackService.startByIndex(eventIndex - 1);
    if (!success) {
      throw new Error(`Event index not recognised or out of range ${eventIndex}`);
    }
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
  load: (payload) => {
    if (payload && typeof payload === 'object') {
      if ('index' in payload) {
        const reply = actionHandlers.loadindex(payload.index);
        return reply;
      }
      if ('id' in payload) {
        const reply = actionHandlers.loadid(payload.id);
        return reply;
      }
      if ('cue' in payload) {
        const reply = actionHandlers.loadcue(payload.cue);
        return reply;
      }
      if ('next' in payload) {
        const reply = actionHandlers.next(payload.next);
        return reply;
      }
      if ('previous' in payload) {
        const reply = actionHandlers.previous(payload.previous);
        return reply;
      }
    }
    throw new Error('No load method provided');
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
