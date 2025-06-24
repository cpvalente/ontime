import { LogOrigin, OntimeAction } from 'ontime-types';

import { logger } from '../../../classes/Logger.js';
import { auxTimerService } from '../../../services/aux-timer-service/AuxTimerService.js';
import * as messageService from '../../../services/message-service/message.service.js';

export function toOntimeAction(action: OntimeAction) {
  const actionType = action.action;
  switch (actionType) {
    // Aux timer actions
    case 'aux1-start':
      return auxTimerService.start(1);
    case 'aux1-stop':
      return auxTimerService.stop(1);
    case 'aux1-pause':
      return auxTimerService.pause(1);
    case 'aux1-set': {
      return auxTimerService.setTime(action.time, 1);
    }
    case 'aux2-start':
      return auxTimerService.start(2);
    case 'aux2-stop':
      return auxTimerService.stop(2);
    case 'aux2-pause':
      return auxTimerService.pause(2);
    case 'aux2-set': {
      return auxTimerService.setTime(action.time, 2);
    }
    case 'aux3-start':
      return auxTimerService.start(3);
    case 'aux3-stop':
      return auxTimerService.stop(3);
    case 'aux3-pause':
      return auxTimerService.pause(3);
    case 'aux3-set': {
      return auxTimerService.setTime(action.time, 3);
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
      actionType satisfies never;
      logger.warning(LogOrigin.Tx, `Unknown action type: ${actionType}`);
      break;
    }
  }
}
