import { HTTPOutput, RuntimeStore } from 'ontime-types';
import { DeepReadonly } from 'ts-essentials';

import { formatLogEvent } from '../../../classes/logFormat.js';
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
    } else {
      reportSendFailure(target, formatLogEvent('http.send-failed', { target, status: response.status }));
    }
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    reportSendFailure(target, formatLogEvent('http.send-failed', { target, error: message }));
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
