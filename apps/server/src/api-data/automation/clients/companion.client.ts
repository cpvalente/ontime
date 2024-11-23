/**
 * Expose possibility to trigger a companion button over the HTTP protocol
 */
export function emitCompanion() {
  console.log('companion emit not implemented');
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
