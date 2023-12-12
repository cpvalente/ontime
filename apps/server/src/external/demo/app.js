/**
 * This is a very minimal example for a websocket client
 * You could use this as a starting point to creating your own interfaces
 *
 * This example does not handle disconnections
 */
// eslint-disable-file --this is an external demo page
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// this would need to resolve to the hostname of where ontime is running
const socket = new WebSocket(`ws://${window.location.hostname}:4001/ws`);
console.log(`ws://${window.location.hostname}:4001/ws`);

function leftPad(number) {
  return number.toString().padStart(2, '0');
}

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);

  // all objects from ontime are structured with type and payload
  const { type, payload } = data;

  // we only need to read message type of ontime
  if (type === 'ontime') {
    // destructure known data from ontime
    // see https://cpvalente.gitbook.io/ontime/control-and-feedback/websocket-api
    const { timer, playback } = payload;
    console.log('Got message from ontime:', timer);
    const timerElement = document.getElementById('timer');
    if (playback == 'stop') {
      timerElement.innerText = '--:--:--';
    } else {
      const now = new Date(timer.current);
      timerElement.innerText = `${leftPad(now.getUTCHours())}:${leftPad(now.getMinutes())}:${leftPad(
        now.getSeconds(),
      )}`;
    }
  }
});
