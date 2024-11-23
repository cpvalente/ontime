/**
 * Expose possibility to send a message using OSC protocol
 */
export function emitOSC() {
  console.log('OSC emit not implemented');
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
