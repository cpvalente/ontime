/*eslint-env browser*/
/**
 * This is a very minimal example for a websocket client
 * You could use this as a starting point to creating your own interfaces
 */

const mts = 1000; // millis to seconds
const mtm = 1000 * 60; // millis to minutes
const mth = 1000 * 60 * 60; // millis to hours

const leftPad = (number) => {
  return Math.floor(number).toString().padStart(2, '0');
};

const formatTimer = (number) => {
  const millis = Math.abs(number);
  const isNegative = number < 0;
  return `${isNegative ? '-' : ''}${leftPad(millis / mth)}:${leftPad((millis % mth) / mtm)}:${leftPad(
    (millis % mtm) / mts,
  )}`;
};

function updateTimerElement(playback, timerValue) {
  const timerElement = document.getElementById('timer');
  if (playback === 'stop') {
    timerElement.innerText = '--:--:--';
  } else {
    timerElement.innerText = formatTimer(timerValue);
  }
}

let reconnectTimeout;
const reconnectInterval = 1000;
let reconnectAttempts = 0;

const connectSocket = () => {
  const websocket = new WebSocket(`ws://${window.location.hostname}:${window.location.port}/ws`);

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
    const data = JSON.parse(event.data);

    // all objects from ontime are structured with type and payload
    const { type, payload } = data;

    // we only need to read message type of ontime
    switch (type) {
      case 'ontime': {
        // destructure known data from ontime
        // see https://docs.getontime.no/api/osc-and-ws/
        const { timer, playback } = payload;
        updateTimerElement(playback, timer);
        break;
      }
      case 'ontime-timer': {
        const { current, playback } = payload;
        updateTimerElement(playback, current);
        break;
      }
    }
  };
};

connectSocket();
