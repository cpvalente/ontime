import { DeepPartial, MessageState, OntimeEvent, SimpleDirection, SimplePlayback } from 'ontime-types';

import { ONTIME_VERSION } from '../ONTIME_VERSION.js';
import { extraTimerService } from '../services/extra-timer-service/ExtraTimerService.js';
import { messageService } from '../services/message-service/MessageService.js';
import { validateMessage, validateTimerMessage } from '../services/message-service/messageUtils.js';
import { runtimeService } from '../services/runtime-service/RuntimeService.js';
import { eventStore } from '../stores/EventStore.js';
import * as assert from '../utils/assert.js';
import { isEmptyObject } from '../utils/parserUtils.js';
import { parse, updateEvent } from './integration.utils.js';

export function dispatchFromAdapter(type: string, payload: unknown, _source?: 'osc' | 'ws' | 'http') {
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
    assert.isObject(payload);
    const eventId = Object.keys(payload)[0] as keyof typeof payload;
    const data = payload[eventId];
    const patchEvent: Partial<OntimeEvent> = {};
    Object.entries(data).forEach(([property, value], _) => {
      const prop = parse(property, value);
      if (patchEvent.custom && prop.custom) {
        Object.assign(patchEvent.custom, prop.custom);
      } else {
        Object.assign(patchEvent, prop);
      }
    });
    //TODO: don't know how to await this
    updateEvent(eventId, patchEvent);
    return { payload: 'changes pending' };
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
    if (payload === undefined) {
      return successPayloadOrError(runtimeService.start(), 'Uable to start');
    } else if (payload && typeof payload === 'object') {
      if ('index' in payload) {
        const eventIndex = numberOrError(payload.index);
        if (eventIndex <= 0) {
          throw new Error(`Event index out of range ${eventIndex}`);
        }
        // Indexes in frontend are 1 based
        return successPayloadOrError(
          runtimeService.startByIndex(eventIndex - 1),
          `Event index not recognised or out of range ${eventIndex}`,
        );
      } else if ('id' in payload) {
        assert.isString(payload.id);
        return successPayloadOrError(runtimeService.startById(payload.id), `Unable to start ID: ${payload.id}`);
      } else if ('cue' in payload) {
        const cue = stringAndNumberOrError(payload.cue);
        return successPayloadOrError(runtimeService.startByCue(cue), `Unable to start CUE: ${cue}`);
      }
    } else if (typeof payload === 'string') {
      if (payload === 'next') {
        return successPayloadOrError(runtimeService.startNext(), 'Unable to start next event');
      } else if (payload === 'previous') {
        return successPayloadOrError(runtimeService.startPrevious(), 'Unable to start previous event');
      }
    }
    throw new Error('No matching start function');
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
        return successPayloadOrError(
          runtimeService.loadByIndex(eventIndex - 1),
          `Event index not recognised or out of range ${eventIndex}`,
        );
      } else if ('id' in payload) {
        assert.isString(payload.id);
        return successPayloadOrError(runtimeService.loadById(payload.id), `Unable to load ID: ${payload.id}`);
      } else if ('cue' in payload) {
        const cue = stringAndNumberOrError(payload.cue);
        return successPayloadOrError(runtimeService.loadByCue(cue), `Unable to load CUE: ${cue}`);
      }
    } else if (typeof payload === 'string') {
      if (payload === 'next') {
        return successPayloadOrError(runtimeService.loadNext(), 'Unable to load next event');
      } else if (payload === 'previous') {
        return successPayloadOrError(runtimeService.loadPrevious(), 'Unable to load previous event');
      }
    }
    throw new Error('No matching method provided');
  },
  addtime: (payload) => {
    let time = 0;
    if (payload && typeof payload === 'object') {
      if ('add' in payload) {
        time = numberOrError(payload.add);
      } else if ('remove' in payload) {
        time = numberOrError(payload.remove) * -1;
      }
    } else {
      time = numberOrError(payload);
    }
    assert.isNumber(time);
    if (time === 0) {
      return { payload: 'success' };
    }
    runtimeService.addTime(time * 1000); //frontend is seconds based
    return { payload: 'success' };
  },
  /* Extra timers */
  extratimer: (payload) => {
    assert.isObject(payload);
    if (!('1' in payload)) {
      throw new Error('Invalid extratimer index');
    }
    const command = payload['1'];
    if (typeof command === 'string') {
      if (command === SimplePlayback.Start) {
        const reply = extraTimerService.start();
        return { payload: reply };
      }
      if (command === SimplePlayback.Pause) {
        const reply = extraTimerService.pause();
        return { payload: reply };
      }
      if (command === SimplePlayback.Stop) {
        const reply = extraTimerService.stop();
        return { payload: reply };
      }
    } else if (command && typeof command === 'object') {
      const reply = { payload: {} };
      if ('duration' in command) {
        const time = numberOrError(command.duration);
        reply.payload = extraTimerService.setTime(time * 1000); //frontend is seconds based
      }
      if ('direction' in command) {
        if (command.direction === SimpleDirection.CountUp || command.direction === SimpleDirection.CountDown) {
          reply.payload = extraTimerService.setDirection(command.direction);
        } else {
          throw new Error('Invalid direction payload');
        }
      }
      if (!isEmptyObject(reply.payload)) {
        return reply;
      }
    }
    throw new Error('No matching method provided');
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

function successPayloadOrError(success: boolean, error: string) {
  if (!success) {
    throw new Error(error);
  }
  return { payload: 'success' };
}
