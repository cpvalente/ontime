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
import { isEmptyObject } from '../utils/parserUtils.js';

export type ChangeOptions = {
  eventId: string;
  property: string;
  value: unknown;
};

export function dispatchFromAdapter(type: string, payload: unknown, _source?: 'osc' | 'ws' | 'http') {
  const action = type.toLowerCase();
  console.log(action, payload);

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
    //TODO: this is not done
    // WS: {type: 'change', payload: { eventId, property, value } }
    const { eventId, property, value } = payload as ChangeOptions;
    const { parsedPayload, parsedProperty } = parse(property, value);

    const updatedEvent = updateEvent(eventId, parsedProperty, parsedPayload);
    return { payload: updatedEvent };
  },
  /* Message Service */
  message: (payload) => {
    //TODO: this is not done

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
    if (payload === undefined) {
      runtimeService.start();
      return { payload: 'success' };
    } else if (typeof payload === 'object') {
      if ('index' in payload) {
        const eventIndex = numberOrError(payload.index);
        if (eventIndex <= 0) {
          throw new Error(`Event index out of range ${eventIndex}`);
        }
        const success = runtimeService.startByIndex(eventIndex - 1); // Indexes in frontend are 1 based
        if (!success) {
          throw new Error(`Event index not recognised or out of range ${eventIndex}`);
        }
        return { payload: 'success' };
      } else if ('id' in payload) {
        assert.isString(payload.id);
        runtimeService.startById(payload.id);
        return { payload: 'success' };
      } else if ('cue' in payload) {
        const cue = stringAndNumberOrError(payload.cue);
        runtimeService.startByCue(cue);
        return { payload: 'success' };
      }
    } else if (typeof payload === 'string') {
      if (payload == 'next') {
        runtimeService.startNext();
        return { payload: 'success' };
      } else if (payload == 'previous') {
        runtimeService.startPrevious();
        return { payload: 'success' };
      }
    }
    throw new Error('no matching start function');
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
        const success = runtimeService.loadByIndex(eventIndex - 1); // Indexes in frontend are 1 based
        if (!success) {
          throw new Error(`Event index not recognised or out of range ${eventIndex}`);
        }
        return { payload: 'success' };
      } else if ('id' in payload) {
        assert.isString(payload.id);
        runtimeService.loadById(payload.id);
        return { payload: 'success' };
      } else if ('cue' in payload) {
        const cue = stringAndNumberOrError(payload.cue);
        runtimeService.loadByCue(cue);
        return { payload: 'success' };
      }
    } else if (payload && typeof payload === 'string') {
      if (payload == 'next') {
        runtimeService.loadNext();
        return { payload: 'success' };
      } else if (payload == 'previous') {
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
    runtimeService.addTime(time * 1000); //frontend is seconds based
    return { payload: 'success' };
  },
  /* Extra timers */
  extratimer: (payload) => {
    if (payload && typeof payload === 'object') {
      if (!('1' in payload)) {
        throw new Error('Invalid extratimer index');
      }
      const value = payload['1'];
      if (typeof value === 'string') {
        if (value === SimplePlayback.Start) {
          const reply = extraTimerService.start();
          return { payload: reply };
        }
        if (value === SimplePlayback.Pause) {
          const reply = extraTimerService.pause();
          return { payload: reply };
        }
        if (value === SimplePlayback.Stop) {
          const reply = extraTimerService.stop();
          return { payload: reply };
        }
      }
      if (typeof value === 'object') {
        const reply = { payload: {} };
        if ('duration' in value) {
          const time = numberOrError(value.duration);
          reply.payload = extraTimerService.setTime(time * 1000); //frontend is seconds based
        }
        if ('direction' in value) {
          if (value.direction === SimpleDirection.CountUp || value.direction === SimpleDirection.CountDown) {
            reply.payload = extraTimerService.setDirection(value.direction);
          } else {
            throw new Error('Invalid direction payload');
          }
        }
        if (!isEmptyObject(reply.payload)) {
          return reply;
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

function stringAndNumberOrError(value: unknown) {
  let converted = value;
  if (typeof converted == 'number') {
    converted = String(converted);
  }
  if (typeof converted == 'string') {
    return converted;
  }
  throw new Error('Payload is not a valid string or number');
}
