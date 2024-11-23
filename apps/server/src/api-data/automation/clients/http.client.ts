/**
 * Expose possibility to send a message using HTTP protocol
 */
export function emitHTTP() {
  console.log('HTTP emit not implemented');
  const payload = preparePayload();
  emit(payload);
}

/** Parses the state and prepares payload to be emitted */
function preparePayload() {
  return;
}

/** Emits message over transport */
function emit(_payload) {
  return;
}
