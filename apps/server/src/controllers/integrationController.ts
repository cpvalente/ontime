import { messageService } from '../services/message-service/MessageService.js';
import { PlaybackService } from '../services/PlaybackService.js';
import { eventStore } from '../stores/EventStore.js';

export function dispatchFromAdapter(
  type: string,
  args: {
    payload: unknown;
    param?: string;
  },
  source?: 'osc' | 'ws',
) {
  const payload = args.payload;
  const typeComponents = type.toLowerCase().split('/');
  const mainType = typeComponents[0];
  const param = args.param;

  switch (mainType) {
    case 'test-ontime': {
      return { topic: 'hello' };
    }

    case 'ontime-poll': {
      return {
        topic: 'poll',
        payload: eventStore.poll(),
      };
    }

    case 'set-onair': {
      if (typeof payload !== 'undefined') {
        messageService.setOnAir(Boolean(payload));
      }
      break;
    }

    case 'onair': {
      messageService.setOnAir(true);
      break;
    }

    case 'offair': {
      messageService.setOnAir(false);
      break;
    }

    case 'set-timer-blink': {
      if (typeof payload !== 'undefined') {
        messageService.setTimerBlink(Boolean(payload));
      }
      break;
    }

    case 'set-timer-blackout': {
      if (typeof payload !== 'undefined') {
        messageService.setTimerBlackout(Boolean(payload));
      }
      break;
    }

    case 'set-timer-message-text': {
      if (typeof payload !== 'string') {
        throw new Error(`Unable to parse payload: ${payload}`);
      }
      messageService.setTimerText(payload);
      break;
    }
    case 'set-timer-message-visible': {
      if (typeof payload === 'undefined') {
        throw new Error(`Unable to parse payload: ${payload}`);
      }
      messageService.setTimerVisibility(Boolean(payload));
      break;
    }

    case 'set-public-message-text': {
      if (typeof payload !== 'string') {
        throw new Error(`Unable to parse payload: ${payload}`);
      }
      messageService.setPublicText(payload);
      break;
    }
    case 'set-public-message-visible': {
      if (typeof payload === 'undefined') {
        throw new Error(`Unable to parse payload: ${payload}`);
      }
      messageService.setPublicVisibility(Boolean(payload));
      break;
    }

    case 'set-lower-message-text': {
      if (typeof payload !== 'string') {
        throw new Error(`Unable to parse payload: ${payload}`);
      }
      messageService.setLowerText(payload);
      break;
    }
    case 'set-lower-message-visible': {
      if (typeof payload === 'undefined') {
        throw new Error(`Unable to parse payload: ${payload}`);
      }
      messageService.setLowerVisibility(Boolean(payload));
      break;
    }

    case 'start': {
      PlaybackService.start();
      break;
    }

    case 'start-next': {
      PlaybackService.startNext();
      break;
    }

    case 'startindex': {
      const eventIndex = Number(payload);
      if (isNaN(eventIndex) || eventIndex <= 0) {
        throw new Error(`Event index not recognised or out of range ${eventIndex}`);
      }

      try {
        // Indexes in frontend are 1 based
        PlaybackService.startByIndex(eventIndex - 1);
      } catch (error) {
        throw new Error(`Error loading event:: ${error}`);
      }
      break;
    }

    case 'startid': {
      if (!payload || typeof payload !== 'string') {
        throw new Error(`Event ID not recognised: ${payload}`);
      }
      PlaybackService.startById(payload);
      break;
    }

    case 'startcue': {
      if (!payload || typeof payload !== 'string') {
        throw new Error(`Event cue not recognised: ${payload}`);
      }
      PlaybackService.startByCue(payload);
      break;
    }

    case 'pause': {
      PlaybackService.pause();
      break;
    }
    case 'previous': {
      PlaybackService.loadPrevious();
      break;
    }
    case 'next': {
      PlaybackService.loadNext();
      break;
    }
    case 'unload':
    case 'stop': {
      PlaybackService.stop();
      break;
    }
    case 'reload': {
      PlaybackService.reload();
      break;
    }
    case 'roll': {
      PlaybackService.roll();
      break;
    }
    case 'delay': {
      const delayTime = Number(payload);
      if (isNaN(delayTime)) {
        throw new Error(`Delay time not recognised ${payload}`);
      }

      try {
        PlaybackService.setDelay(delayTime);
      } catch (error) {
        throw new Error(`Could not add delay: ${error}`);
      }
      break;
    }
    case 'gotoindex':
    case 'loadindex': {
      const eventIndex = Number(payload);
      if (isNaN(eventIndex) || eventIndex <= 0) {
        throw new Error(`Event index not recognised or out of range ${eventIndex}`);
      }

      try {
        // Indexes in frontend are 1 based
        PlaybackService.loadByIndex(eventIndex - 1);
      } catch (error) {
        throw new Error(`Event index not recognised or out of range ${error}`);
      }
      break;
    }
    case 'gotoid':
    case 'loadid': {
      if (!payload) {
        throw new Error(`Event ID not recognised: ${payload}`);
      }

      try {
        PlaybackService.loadById(payload.toString().toLowerCase());
      } catch (error) {
        throw new Error(`OSC IN: error calling goto ${error}`);
      }
      break;
    }
    case 'gotocue':
    case 'loadcue': {
      if (!payload || typeof payload !== 'string') {
        throw new Error(`Event cue not recognised: ${payload}`);
      }

      try {
        PlaybackService.loadByCue(payload);
      } catch (error) {
        throw new Error(`OSC IN: error calling goto ${error}`);
      }
      break;
    }

    case 'get-playback': {
      const playback = eventStore.get('playback');
      return { topic: 'playback', payload: playback };
    }

    case 'get-timer': {
      const timer = eventStore.get('timer');
      return { topic: 'timer', payload: timer };
    }

    case 'update-duration': {
      try {
        if (!param) {
          throw new Error('No event ID provided');
        }

        const duration = Number(payload);

        if (isNaN(duration)) {
          throw new Error(`Duration not recognised: ${payload}`);
        }

        PlaybackService.updateEventDuration(param, duration);
      } catch (error) {
        throw new Error(`Error updating duration: ${error}`);
      }
    }

    default: {
      throw new Error(`Unhandled message ${type}`);
    }
  }
}
