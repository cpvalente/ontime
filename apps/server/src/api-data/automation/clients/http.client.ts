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
  // the receiver is named by its origin, the path and query may carry credentials, eg: webhook tokens
  const target = URL.canParse(url) ? new URL(url).origin : 'invalid-url';
  try {
    const response = await fetch(url);
    if (response.ok) {
      reportSendSuccess(target);
    } else {
      reportSendFailure(target, 'HTTP send failed', { status: response.status });
    }
  } catch (error) {
    // error messages can repeat the full URL
    reportSendFailure(target, 'HTTP send failed', describeError(error));
  }
}

/** names a failure by its type and system code, eg: TypeError ECONNREFUSED */
function describeError(error: unknown) {
  if (!(error instanceof Error)) {
    return { error: 'unknown' };
  }
  const cause: unknown = error.cause;
  const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : undefined;
  return { error: error.name, code };
}
