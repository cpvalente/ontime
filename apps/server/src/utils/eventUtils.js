/**
 * @description Returns id of previous played event
 * @param {array} events
 * @param {string} eventId
 * @return {object}
 */
export function getPreviousPlayable(events, eventId) {
  // find current index
  const current = events.findIndex((event) => event.id === eventId);

  if (current === -1) {
    return { index: null, id: null };
  }

  let index = current - 1;
  while (index >= 0) {
    const event = events[index];
    if (event.type === 'event' && !event.skip) {
      return { index, id: event.id };
    }
    index--;
  }

  return { index: null, id: null };
}
