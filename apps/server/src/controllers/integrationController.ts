// skipcq: JS-C1003 - we like the API
import * as assert from '../utils/assert.js';
import { ONTIME_VERSION } from '../ONTIME_VERSION.js';

import { messageService } from '../services/message-service/MessageService.js';
import { runtimeService } from '../services/runtime-service/RuntimeService.js';
import { eventStore } from '../stores/EventStore.js';
import { parse, updateEvent } from './integrationController.config.js';
import { coerceBoolean, coerceString } from '../utils/coerceType.js';

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
  message: (payload) => {
    if (typeof payload !== 'object') {
      throw new Error('TODO: write error');
    }
    const patch = {};
    if ('timer' in payload) Object.assign(patch, { timer: validateMessage(payload.timer) });
    if ('public' in payload) Object.assign(patch, { public: validateMessage(payload.public) });
    if ('lower' in payload) Object.assign(patch, { lower: validateMessage(payload.lower) });
    if ('external' in payload) Object.assign(patch, { external: validateMessage(payload.external) });

    //   lower: 'lower' in payload ? validateMessage(payload.lower) : undefined,
    //   external: 'external' in payload ? validateMessage(payload.external) : undefined,
    // };

    const newMessage = messageService.setAll(patch);
    return { payload: newMessage };
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

    runtimeService.start();

    return { payload: 'start' };
  },
  startnext: () => {
    runtimeService.startNext();
    return { payload: 'start' };
  },
  startindex: (payload) => {
    const eventIndex = numberOrError(payload);
    if (eventIndex <= 0) {
      throw new Error(`Event index out of range ${eventIndex}`);
    }

    // Indexes in frontend are 1 based
    const success = runtimeService.startByIndex(eventIndex - 1);
    if (!success) {
      throw new Error(`Event index not recognised or out of range ${eventIndex}`);
    }
    return { payload: 'success' };
  },
  startid: (payload) => {
    assert.isString(payload);
    runtimeService.startById(payload);
    return { payload: 'success' };
  },
  startcue: (payload) => {
    assert.isString(payload);
    runtimeService.startByCue(payload);
    return { payload: 'success' };
  },
  pause: () => {
    runtimeService.pause();
    return { payload: 'success' };
  },
  previous: () => {
    runtimeService.loadPrevious();
    return { payload: 'success' };
  },
  next: () => {
    runtimeService.loadNext();
    return { payload: 'success' };
  },
  stop: () => {
    runtimeService.stop();
    return { payload: 'success' };
  },
  reload: () => {
    runtimeService.reload();
    return { payload: 'success' };
  },
  roll: () => {
    runtimeService.roll();
    return { payload: 'success' };
  },
  load: (payload) => {
    if (payload && typeof payload === 'object') {
      if ('index' in payload) {
        return actionHandlers.loadindex(payload.index);
      }
      if ('id' in payload) {
        return actionHandlers.loadid(payload.id);
      }
      if ('cue' in payload) {
        return actionHandlers.loadcue(payload.cue);
      }
      if ('next' in payload) {
        return actionHandlers.next(payload.next);
      }
      if ('previous' in payload) {
        return actionHandlers.previous(payload.previous);
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
    runtimeService.loadByIndex(eventIndex - 1);
    return { payload: 'success' };
  },
  loadid: (payload) => {
    assert.isDefined(payload);
    runtimeService.loadById(payload.toString().toLowerCase());
    return { payload: 'success' };
  },
  loadcue: (payload) => {
    assert.isString(payload);
    runtimeService.loadByCue(payload);
    return { payload: 'success' };
  },
  addtime: (payload) => {
    const time = numberOrError(payload);
    if (time === 0) {
      return { payload: 'success' };
    }
    runtimeService.addTime(time * 1000);
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

function validateMessage(message: unknown) {
  if (typeof message !== 'object') {
    return;
  }
  const result = {};
  if ('text' in message) Object.assign(result, { text: coerceString(message.text) });
  if ('visible' in message) Object.assign(result, { visible: coerceBoolean(message.visible) });
  if ('blink' in message) Object.assign(result, { blink: coerceBoolean(message.blink) });
  if ('blackout' in message) Object.assign(result, { blackout: coerceBoolean(message.blackout) });
  return result;
}
