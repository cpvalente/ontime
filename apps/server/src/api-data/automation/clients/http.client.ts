import { HTTPOutput, RuntimeStore } from 'ontime-types';
import { DeepReadonly } from 'ts-essentials';

import { parseTemplateNested } from '../automation.utils.js';
import { reportSendFailure, reportSendSuccess } from './sendFailures.js';

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
  const target = getTarget(url);
  try {
    const response = await fetch(url);
    if (response.ok) {
      reportSendSuccess(target);
    } else if (response.status >= 500 && response.status < 600) {
      reportSendFailure(target, `HTTP Integration: Server refused message ${response.status} (${target})`);
    } else {
      reportSendFailure(target, `HTTP Integration: Failed sending message ${response.status} (${target})`);
    }
  } catch (error) {
    if (!(error instanceof Error)) {
      reportSendFailure(target, `HTTP Integration: Failed sending message ${error} (${target})`);
      return;
    }

    reportSendFailure(target, `HTTP Integration: ${error.name} ${error.message} (${target})`);
  }
}

/** Identifies the receiver, ignoring the query which templates change on every send */
function getTarget(url: string): string {
  try {
    const { origin, pathname } = new URL(url);
    return `${origin}${pathname}`;
  } catch {
    return url;
  }
}
