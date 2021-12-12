/**
 * @description From a list of events, returns only events of type event with calculated delays
 * @param {Object[]} events - given events
 * @returns {Object[]} Filtered events with calculated delays
 */
export const getEventsWithDelay = (events) => {

  if (events == null) return [];

  const unfilteredEvents = [...events];

  // Add running delay
  let delay = 0;
  for (const e of unfilteredEvents) {
    if (e.type === 'block') delay = 0;
    else if (e.type === 'delay') delay = delay + e.duration;
    else if (e.type === 'event' && delay > 0) {
      e.timeStart += delay;
      e.timeEnd += delay;
    }
  }

  // filter just events
  return unfilteredEvents.filter((e) => e.type === 'event');
}
