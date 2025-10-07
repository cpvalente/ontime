import { HTTPOutput, LogOrigin } from 'ontime-types';

import { logger } from '../../../classes/Logger.js';
import type { RuntimeState } from '../../../stores/runtimeState.js';

import { parseTemplateNested } from '../automation.utils.js';

/**
 * Expose possibility to send a message using HTTP protocol
 */
export function emitHTTP(output: HTTPOutput, state: RuntimeState) {
  const url = preparePayload(output, state);
  emit(url);
}

/** Parses the state and prepares payload to be emitted */
function preparePayload(output: HTTPOutput, state: RuntimeState): string {
  const parsedUrl = parseTemplateNested(output.url, state);
  return parsedUrl;
}

/** Emits message over transport */
async function emit(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status >= 500 && response.status < 600) {
        logger.warning(LogOrigin.Tx, `HTTP Integration: Server refused message ${response.status}`);
      } else if (response.status >= 400) {
        logger.warning(LogOrigin.Tx, `HTTP Integration: Failed sending message ${response.status}`);
      } else {
        logger.warning(LogOrigin.Tx, `HTTP Integration: Failed sending message ${response.status}`);
      }
    }
  } catch (error) {
    if (!(error instanceof Error)) {
      logger.warning(LogOrigin.Tx, `HTTP Integration: Failed sending message ${error}`);
      return;
    }

    logger.warning(LogOrigin.Tx, `HTTP Integration: ${error.name} ${error.message}`);
  }
}
