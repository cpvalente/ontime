import { OntimeEvent, isOntimeEvent } from 'ontime-types';

import { DataProvider } from '../data-provider/DataProvider.js';

/**
 * Manages business logic around loading and finding events
 */
export class EventLoader {
  // TODO: migrate logic to RundownService

  /**
   * returns all events that contain time data
   * @return {array}
   */
  static getTimedEvents(): OntimeEvent[] {
    return DataProvider.getRundown().filter((event) => isOntimeEvent(event)) as OntimeEvent[];
  }

  /**
   * returns all events that can be loaded
   * @return {array}
   */
  static getPlayableEvents(): OntimeEvent[] {
    return DataProvider.getRundown().filter((event) => isOntimeEvent(event) && !event.skip) as OntimeEvent[];
  }

  /**
   * returns number of events
   * @return {number}
   */
  static getNumEvents(): number {
    return EventLoader.getPlayableEvents().length;
  }

  /**
   * returns an event given its index after filtering for OntimeEvents
   * @param {number} eventIndex
   * @return {OntimeEvent | undefined}
   */
  static getEventAtIndex(eventIndex: number): OntimeEvent | undefined {
    const timedEvents = EventLoader.getTimedEvents();
    return timedEvents.at(eventIndex);
  }

  /**
   * returns an event given its id
   * @param {string} eventId
   * @return {object | undefined}
   */
  static getEventWithId(eventId: string): OntimeEvent | undefined {
    const timedEvents = EventLoader.getTimedEvents();
    return timedEvents.find((event) => event.id === eventId);
  }

  /**
   * returns first event given its cue
   * @param {string} cue
   * @return {object | undefined}
   */
  static getEventWithCue(cue: string): OntimeEvent | undefined {
    const timedEvents = EventLoader.getTimedEvents();
    return timedEvents.find((event) => event.cue.toLowerCase() === cue.toLowerCase());
  }

  /**
   * finds the previous event
   * @return {object | undefined}
   */
  static findPrevious(currentEventId?: string): OntimeEvent | null {
    const timedEvents = EventLoader.getPlayableEvents();
    if (!timedEvents || !timedEvents.length) {
      return null;
    }

    // if there is no event running, go to first
    if (!currentEventId) {
      return timedEvents.at(0);
    }

    const currentIndex = timedEvents.findIndex((event) => event.id === currentEventId);
    const newIndex = Math.max(currentIndex - 1, 0);
    const previousEvent = timedEvents.at(newIndex);
    return previousEvent;
  }

  /**
   * finds the next event
   * @return {object | undefined}
   */
  static findNext(currentEventId?: string): OntimeEvent | null {
    const timedEvents = EventLoader.getPlayableEvents();
    if (!timedEvents || !timedEvents.length) {
      return null;
    }

    // if there is no event running, go to first
    if (!currentEventId) {
      return timedEvents.at(0);
    }

    const currentIndex = timedEvents.findIndex((event) => event.id === currentEventId);
    const newIndex = (currentIndex + 1) % timedEvents.length;
    const nextEvent = timedEvents.at(newIndex);
    return nextEvent;
  }
}
