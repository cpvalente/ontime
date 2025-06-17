import { LogOrigin, OntimeAction } from 'ontime-types';

import { logger } from '../../../classes/Logger.js';
import { auxTimerService } from '../../../services/aux-timer-service/AuxTimerService.js';
import * as messageService from '../../../services/message-service/MessageService.js';

export function toOntimeAction(action: OntimeAction) {
  const actionType = action.action;
  switch (actionType) {
    // Aux timer actions
    case 'aux-start':
      auxTimerService.start();
      break;
    case 'aux-stop':
      auxTimerService.stop();
      break;
    case 'aux-pause':
      auxTimerService.pause();
      break;
    case 'aux-set': {
      auxTimerService.setTime(action.time);
      break;
    }

    // Message actions
    case 'message-set': {
      messageService.patch({
        timer: {
          text: action.text,
          visible: action.visible,
        },
      });
      break;
    }
    case 'message-secondary': {
      messageService.patch({
        timer: {
          secondarySource: action.secondarySource,
        },
      });
      break;
    }

    default: {
      const unknownAction: never = actionType;
      logger.warning(LogOrigin.Tx, `Unknown action type: ${unknownAction}`);
      break;
    }
  }
}
