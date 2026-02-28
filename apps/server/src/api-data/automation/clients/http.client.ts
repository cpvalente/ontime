import { DeepReadonly } from 'ts-essentials';
import { HTTPOutput, LogOrigin, RuntimeStore } from 'ontime-types';

import { logger } from '../../../classes/Logger.js';

import { parseTemplateNested } from '../automation.utils.js';

/**
 * Expose possibility to send a message using HTTP protocol
 */
export function emitHTTP(output: HTTPOutput, store: DeepReadonly<RuntimeStore>) {
  const url = preparePayload(output, store);
  emit(url);
}

/** Parses the state and prepares payload to be emitted */
function preparePayload(output: HTTPOutput, state: DeepReadonly<RuntimeStore>): string {
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
