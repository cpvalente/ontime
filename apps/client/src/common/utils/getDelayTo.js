/**
 * @description calculates delay to a given event
 * @param {array} events
 * @param {number} eventIndex
 * @return {number} - delay value of given event
 */
export default function getDelayTo(events, eventIndex) {
  let delay = 0;
  let index = 0;
  if (eventIndex >= 0) {
    for (const event of events) {
      if (eventIndex === index) {
        return delay;
      }

      if (event.type === 'delay') {
        delay += event.duration;
      } else if (event.type === 'block') {
        delay = 0;
      }
      index++;
    }
  }
  return 0;
}
