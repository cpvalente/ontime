import {
  ApiAction,
  MessageState,
  OffsetMode,
  OntimeEvent,
  PatchWithId,
  SimpleDirection,
  SimplePlayback,
} from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { DeepPartial } from 'ts-essentials';

import { ONTIME_VERSION } from '../ONTIME_VERSION.js';
import { auxTimerService } from '../services/aux-timer-service/AuxTimerService.js';
import * as messageService from '../services/message-service/MessageService.js';
import { validateMessage, validateTimerMessage } from '../services/message-service/messageUtils.js';
import { runtimeService } from '../services/runtime-service/RuntimeService.js';
import { eventStore } from '../stores/EventStore.js';
import * as assert from '../utils/assert.js';
import { isEmptyObject } from '../utils/parserUtils.js';
import { parseProperty } from './integration.utils.js';
import { socket } from '../adapters/WebsocketAdapter.js';
import { throttle } from '../utils/throttle.js';
import { coerceEnum } from '../utils/coerceType.js';
import { editEntry } from '../api-data/rundown/rundown.service.js';
import { willCauseRegeneration } from '../api-data/rundown/rundown.utils.js';

const throttledEditEvent = throttle(editEntry, 20);
let lastRequest: Date | null = null;

export function dispatchFromAdapter(tag: string, payload: unknown, _source?: 'osc' | 'ws' | 'http') {
  const action = tag.toLowerCase();
  const handler = actionHandlers[action as ApiAction];
  lastRequest = new Date();

  if (handler) {
    return handler(payload);
  } else {
    throw new Error(`Unhandled message ${tag}`);
  }
}

export function getLastRequest() {
  return lastRequest;
}

type ActionHandler = (payload: unknown) => { payload: unknown };

const actionHandlers: Record<ApiAction, ActionHandler> = {
  /* General */
  version: () => ({ payload: ONTIME_VERSION }),
  poll: () => ({
    payload: eventStore.poll(),
  }),
  change: (payload) => {
    assert.isObject(payload);
    if (Object.keys(payload).length === 0) {
      throw new Error('Payload is empty');
    }

    const id = Object.keys(payload).at(0);
    if (!id) {
      throw new Error('Missing Event ID');
    }

    const data = payload[id as keyof typeof payload];
    const patchEvent: PatchWithId<OntimeEvent> = { id };

    let shouldThrottle = false;

    Object.entries(data).forEach(([property, value]) => {
      if (typeof property !== 'string' || value === undefined) {
        throw new Error('Invalid property or value');
      }
      // parseProperty is async because of the data lock
      const newObjectProperty = parseProperty(property, value);
      const key = Object.keys(newObjectProperty)[0] as keyof OntimeEvent;
      shouldThrottle = shouldThrottle || willCauseRegeneration(key);
      if (patchEvent.custom && newObjectProperty.custom) {
        Object.assign(patchEvent.custom, newObjectProperty.custom);
      } else {
        Object.assign(patchEvent, newObjectProperty);
      }
    });

    if (shouldThrottle) {
      if (throttledEditEvent(patchEvent)) {
        return { payload: 'throttled' };
      }
    } else {
      editEntry(patchEvent).catch((_error) => {
        /** No error handling */
      });
    }
    return { payload: 'success' };
  },
  /* Message Service */
  message: (payload) => {
    assert.isObject(payload);

    const patch: DeepPartial<MessageState> = {
      timer: 'timer' in payload ? validateTimerMessage(payload.timer) : undefined,
      external: 'external' in payload ? validateMessage(payload.external) : undefined,
    };

    const newMessage = messageService.patch(patch);
    return { payload: newMessage };
  },
  /* Playback */
  start: (payload) => {
    if (payload === undefined) {
      return successPayloadOrError(runtimeService.start(), 'Unable to start');
    }

    if (payload && typeof payload === 'object') {
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
      }

      if ('id' in payload) {
        assert.isString(payload.id);
        return successPayloadOrError(runtimeService.startById(payload.id), `Unable to start ID: ${payload.id}`);
      }

      if ('cue' in payload) {
        const cue = extractCue(payload.cue);
        return successPayloadOrError(runtimeService.startByCue(cue), `Unable to start CUE: ${cue}`);
      }
    }

    if (payload === 'next') {
      return successPayloadOrError(runtimeService.startNext(), 'Unable to start next event');
    }

    if (payload === 'previous') {
      return successPayloadOrError(runtimeService.startPrevious(), 'Unable to start previous event');
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
      }

      if ('id' in payload) {
        assert.isString(payload.id);
        return successPayloadOrError(runtimeService.loadById(payload.id), `Unable to load ID: ${payload.id}`);
      }

      if ('cue' in payload) {
        const cue = extractCue(payload.cue);
        return successPayloadOrError(runtimeService.loadByCue(cue), `Unable to load CUE: ${cue}`);
      }
    }

    if (payload === 'next') {
      return successPayloadOrError(runtimeService.loadNext(), 'Unable to load next event');
    }

    if (payload === 'previous') {
      return successPayloadOrError(runtimeService.loadPrevious(), 'Unable to load previous event');
    }
    throw new Error('No matching method provided');
  },
  addtime: (payload) => {
    const time = (() => {
      if (payload && typeof payload === 'object') {
        if ('add' in payload) return numberOrError(payload.add);
        if ('remove' in payload) return numberOrError(payload.remove) * -1;
      }
      return numberOrError(payload);
    })();

    assert.isNumber(time);
    if (time === 0) {
      return { payload: 'success' };
    }

    if (Math.abs(time) > MILLIS_PER_HOUR) {
      throw new Error(`Payload too large: ${time}`);
    }

    runtimeService.addTime(time);
    return { payload: 'success' };
  },
  /* Extra timers */
  auxtimer: (payload) => {
    assert.isObject(payload);
    if (!('1' in payload)) {
      throw new Error('Invalid auxtimer index');
    }
    const command = payload['1'];
    if (typeof command === 'string') {
      if (command === SimplePlayback.Start) {
        const reply = auxTimerService.start();
        return { payload: reply };
      }
      if (command === SimplePlayback.Pause) {
        const reply = auxTimerService.pause();
        return { payload: reply };
      }
      if (command === SimplePlayback.Stop) {
        const reply = auxTimerService.stop();
        return { payload: reply };
      }
    } else if (command && typeof command === 'object') {
      const reply = { payload: {} };
      if ('duration' in command) {
        const timeInMs = numberOrError(command.duration);
        reply.payload = auxTimerService.setTime(timeInMs);
      }
      if ('addtime' in command) {
        const timeInMs = numberOrError(command.addtime);
        reply.payload = auxTimerService.addTime(timeInMs);
      }
      if ('direction' in command) {
        if (command.direction === SimpleDirection.CountUp || command.direction === SimpleDirection.CountDown) {
          reply.payload = auxTimerService.setDirection(command.direction);
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
  /* Client */
  client: (payload) => {
    assert.isObject(payload);
    if (!('target' in payload) || typeof payload.target != 'string') {
      throw new Error('No or invalid client target');
    }

    if ('rename' in payload && typeof payload.rename == 'string') {
      const { target, rename } = payload;
      socket.renameClient(target, rename);
      return { payload: 'success' };
    }

    if ('redirect' in payload && typeof payload.redirect == 'string') {
      const { target, redirect } = payload;
      socket.redirectClient(target, redirect);
      return { payload: 'success' };
    }

    if ('identify' in payload && typeof payload.identify == 'boolean') {
      const { target, identify } = payload;
      socket.identifyClient(target, identify);
      return { payload: 'success' };
    }

    throw new Error('No matching method provided');
  },
  offsetmode: (payload) => {
    const mode = coerceEnum<OffsetMode>(payload, OffsetMode);
    runtimeService.setOffsetMode(mode);
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

function extractCue(value: unknown): string {
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  throw new Error('Payload is not a valid string or number');
}

function successPayloadOrError(success: boolean, error: string) {
  if (!success) {
    throw new Error(error);
  }
  return { payload: 'success' };
}
