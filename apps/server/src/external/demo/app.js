/*eslint-env browser*/
/**
 * This is a very minimal example for a websocket client
 * You could use this as a starting point to creating your own interfaces
 */

// Data that the user needs to provide depending on the Ontime URL
const isSecure = window.location.protocol === 'https:';
const userProvidedSocketUrl = `${isSecure ? 'wss' : 'ws'}://${window.location.host}${getStageHash()}/ws`;

connectSocket();

let reconnectTimeout;
const reconnectInterval = 1000;
let reconnectAttempts = 0;

/**
 * Connects to the websocket server
 * @param {string} socketUrl
 */
function connectSocket(socketUrl = userProvidedSocketUrl) {
  const websocket = new WebSocket(socketUrl);

  websocket.onopen = () => {
    clearTimeout(reconnectTimeout);
    reconnectAttempts = 0;
    console.warn('WebSocket connected');
  };

  websocket.onclose = () => {
    console.warn('WebSocket disconnected');
    reconnectTimeout = setTimeout(() => {
      console.warn(`WebSocket: attempting reconnect ${reconnectAttempts}`);
      if (websocket && websocket.readyState === WebSocket.CLOSED) {
        reconnectAttempts += 1;
        connectSocket();
      }
    }, reconnectInterval);
  };
  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  websocket.onmessage = (event) => {
    // all objects from ontime are structured with tag and payload
    const { tag, payload } = JSON.parse(event.data);

    /**
     * runtime-data is sent
     * - on connect with the full state
     * - and then on every update with a patch
     */
    if (tag === 'runtime-data') {
      handleOntimePayload(payload);
    }
  };
}

let localData = {};
/**
 * Handles the ontime payload updates
 * @param {object} payload - The payload object containing the updates
 */
function handleOntimePayload(payload) {
  // 1. apply the patch into your local copy of the data
  localData = { ...localData, ...payload };

  // 2. update the UI with the new data
  // ... timer data
  if ('clock' in payload) updateDOM('clock', formatTimer(payload.clock));
  if ('timer' in payload) updateDOM('timer', formatObject(payload.timer));
  // ... rundown data
  if ('rundown' in payload) updateDOM('rundown', formatObject(payload.rundown));
  // ... runtime
  if ('offset' in payload) updateDOM('offset', formatObject(payload.offset));
  // ... relevant entries
  if ('eventNow' in payload) updateDOM('eventNow', formatObject(payload.eventNow));
  if ('eventNext' in payload) updateDOM('eventNext', formatObject(payload.eventNext));
  if ('eventFlag' in payload) updateDOM('eventFlag', formatObject(payload.eventFlag));
  if ('groupNow' in payload) updateDOM('groupNow', formatObject(payload.groupNow));
  // ... messages service
  if ('message' in payload) updateDOM('message', formatObject(payload.message));
  // ... extra timers
  if ('auxtimer1' in payload) updateDOM('auxtimer1', formatObject(payload.auxtimer1));
  if ('auxtimer2' in payload) updateDOM('auxtimer2', formatObject(payload.auxtimer2));
  if ('auxtimer3' in payload) updateDOM('auxtimer3', formatObject(payload.auxtimer3));
}

/**
 * Updates the DOM with a given payload
 * @param {string} field - The runtime data field
 * @param {object} payload - The patch object for the field
 */
function updateDOM(field, payload) {
  const domElement = document.getElementById(field);
  if (domElement) {
    domElement.innerText = payload;
  }
}

// Time constants used for calculating times
const millisToSeconds = 1000;
const millisToMinutes = 1000 * 60;
const millisToHours = 1000 * 60 * 60;

/**
 * Formats a timer value into a human-readable string
 * @param {number} number - The timer value in milliseconds
 * @returns {string} The formatted timer string
 */
function formatTimer(number) {
  if (number == null) {
    return '--:--:--';
  }
  const millis = Math.abs(number);
  const isNegative = number < 0;
  return `${isNegative ? '-' : ''}${leftPad(millis / millisToHours)}:${leftPad(
    (millis % millisToHours) / millisToMinutes,
  )}:${leftPad((millis % millisToMinutes) / millisToSeconds)}`;

  /**
   * Pads a number with leading zeros
   * @param {number} number - The number to pad
   * @returns {string} The padded number string
   */
  function leftPad(number) {
    return Math.floor(number).toString().padStart(2, '0');
  }
}

/**
 * Stringifies an object into a pretty string
 * @param {object} data - The data object to format
 * @returns {string} The formatted data string
 */
function formatObject(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Utility to handle a demo deployed in an ontime stage
 * You can likely ignore this in your app
 *
 * an url looks like
 * https://cloud.getontime.no/stage-hash/external/demo/ -> /stage-hash
 * @returns {string} - The stage hash if the app is running in an ontime stage
 */
function getStageHash() {
  const href = window.location.href;
  if (!href.includes('getontime.no')) {
    return '';
  }

  const hash = href.split('/');
  const stageHash = hash.at(3);
  return stageHash ? `/${stageHash}` : '';
}
