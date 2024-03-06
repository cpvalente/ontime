import { DeepPartial, MessageState, SimpleDirection, SimplePlayback } from 'ontime-types';

// skipcq: JS-C1003 - we like the API
import * as assert from '../utils/assert.js';
import { ONTIME_VERSION } from '../ONTIME_VERSION.js';

import { messageService } from '../services/message-service/MessageService.js';
import { runtimeService } from '../services/runtime-service/RuntimeService.js';
import { eventStore } from '../stores/EventStore.js';
import { extraTimerService } from '../services/extra-timer-service/ExtraTimerService.js';
import { validateMessage, validateTimerMessage } from '../services/message-service/messageUtils.js';

import { parse, updateEvent } from './integration.utils.js';

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
    assert.isObject(payload);

    const patch: DeepPartial<MessageState> = {
      timer: 'timer' in payload ? validateTimerMessage(payload.timer) : undefined,
      public: 'public' in payload ? validateMessage(payload.public) : undefined,
      lower: 'lower' in payload ? validateMessage(payload.lower) : undefined,
      external: 'external' in payload ? validateMessage(payload.external) : undefined,
    };

    const newMessage = messageService.patch(patch);
    return { payload: newMessage };
  },
  /* Playback */
  start: (payload) => {
    if (payload && typeof payload === 'object') {
      if ('next' in payload) {
        runtimeService.startNext();
        return { payload: 'start' };
      }
      if ('index' in payload) {
        const eventIndex = numberOrError(payload.index);
        if (eventIndex <= 0) {
          throw new Error(`Event index out of range ${eventIndex}`);
        }
        // Indexes in frontend are 1 based
        const success = runtimeService.startByIndex(eventIndex - 1);
        if (!success) {
          throw new Error(`Event index not recognised or out of range ${eventIndex}`);
        }
        return { payload: 'success' };
      }
      if ('id' in payload) {
        assert.isString(payload.id);
        runtimeService.startById(payload.id);
        return { payload: 'success' };
      }
      if ('cue' in payload) {
        assert.isString(payload.cue);
        runtimeService.startByCue(payload.cue);
        return { payload: 'success' };
      }
    }
    runtimeService.start();
    return { payload: 'start' };
  },
  pause: () => {
    runtimeService.pause();
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
        const eventIndex = numberOrError(payload.index);
        if (eventIndex <= 0) {
          throw new Error(`Event index out of range ${eventIndex}`);
        }
        // Indexes in frontend are 1 based
        runtimeService.loadByIndex(eventIndex - 1);
        return { payload: 'success' };
      }
      if ('id' in payload) {
        assert.isDefined(payload.id);
        runtimeService.loadById(payload.id.toString().toLowerCase());
        return { payload: 'success' };
      }
      if ('cue' in payload) {
        assert.isString(payload.cue);
        runtimeService.loadByCue(payload.cue);
        return { payload: 'success' };
      }
      if ('next' in payload) {
        runtimeService.loadNext();
        return { payload: 'success' };
      }
      if ('previous' in payload) {
        runtimeService.loadPrevious();
        return { payload: 'success' };
      }
    }
    throw new Error('No load method provided');
  },
  addtime: (payload) => {
    const time = numberOrError(payload);
    if (time === 0) {
      return { payload: 'success' };
    }
    runtimeService.addTime(time * 1000);
    return { payload: 'success' };
  },
  /* Extra timers */
  extratimer: (payload) => {
    if (payload && typeof payload === 'string') {
      if (payload === SimplePlayback.Start) {
        const reply = extraTimerService.start();
        return { payload: reply };
      }
      if (payload === SimplePlayback.Pause) {
        const reply = extraTimerService.pause();
        return { payload: reply };
      }
      if (payload === SimplePlayback.Stop) {
        const reply = extraTimerService.stop();
        return { payload: reply };
      }
    }

    if (payload && typeof payload === 'object') {
      if ('settime' in payload) {
        const time = numberOrError(payload.settime);
        const reply = extraTimerService.setTime(time);
        return { payload: reply };
      }
      if ('direction' in payload) {
        if (payload.direction === SimpleDirection.CountUp || payload.direction === SimpleDirection.CountDown) {
          const reply = extraTimerService.setDirection(payload.direction);
          return { payload: reply };
        } else {
          throw new Error('Invalid direction payload');
        }
      }
    }
    throw new Error('Invalid extra-timer payload');
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
