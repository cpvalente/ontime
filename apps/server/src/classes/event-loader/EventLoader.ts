import { Loaded, OntimeEvent, SupportedEvent } from 'ontime-types';

import { DataProvider } from '../data-provider/DataProvider.js';
import { getRollTimers } from '../../services/rollUtils.js';
import { eventStore } from '../../stores/EventStore.js';

let instance;

/**
 * Manages business logic around loading events
 */
export class EventLoader {
  loaded: Loaded;
  eventNow: OntimeEvent | null;
  publicEventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;
    this.eventNow = null;
    this.publicEventNow = null;
    this.eventNext = null;
    this.publicEventNext = null;
    this.loaded = {
      selectedEventIndex: null,
      selectedEventId: null,
      selectedPublicEventId: null,
      nextEventId: null,
      nextPublicEventId: null,
      numEvents: 0,
    };
  }

  // we need to delay init until the store is ready
  init() {
    this.reset(false);
  }

  /**
   * returns all events that contain time data
   * @return {array}
   */
  static getTimedEvents(): OntimeEvent[] {
    return DataProvider.getRundown().filter((event) => event.type === SupportedEvent.Event) as OntimeEvent[];
  }

  /**
   * returns all events that can be loaded
   * @return {array}
   */
  static getPlayableEvents(): OntimeEvent[] {
    return DataProvider.getRundown().filter(
      (event) => event.type === SupportedEvent.Event && !event.skip,
    ) as OntimeEvent[];
  }

  /**
   * returns number of events
   * @return {number}
   */
  static getNumEvents() {
    return EventLoader.getTimedEvents().length;
  }

  /**
   * returns an event given its index after filtering for OntimeEvents
   * @param {number} eventIndex
   * @return {OntimeEvent | undefined}
   */
  static getEventAtIndex(eventIndex: number): OntimeEvent | undefined {
    const timedEvents = EventLoader.getTimedEvents();
    return timedEvents?.[eventIndex];
  }

  /**
   * returns an event given its id
   * @param {string} eventId
   * @return {object | undefined}
   */
  static getEventWithId(eventId): OntimeEvent | undefined {
    const timedEvents = EventLoader.getTimedEvents();
    return timedEvents.find((event) => event.id === eventId);
  }

  /**
   * returns first event given its cue
   * @param {string} cue
   * @return {object | undefined}
   */
  static getEventWithCue(cue) {
    const timedEvents = EventLoader.getTimedEvents();
    return timedEvents.find((event) => event.cue.toLowerCase() === cue.toLowerCase());
  }

  /**
   * loads an event given its id
   * @param {string} eventId
   * @returns {{loadedEvent: null, selectedEventId: null, nextEventId: null, selectedPublicEventId: null, nextPublicEventId: null, numEvents: null, titles: {presenterNext: null, titleNow: null, subtitleNow: null, titleNext: null, subtitleNext: null, presenterNow: null, noteNow: null, noteNext: null}, titlesPublic: {presenterNext: null, titleNow: null, subtitleNow: null, titleNext: null, subtitleNext: null, presenterNow: null}, selectedEventIndex: null}}
   */
  loadById(eventId) {
    const event = EventLoader.getEventWithId(eventId);
    return this.loadEvent(event);
  }

  /**
   * loads an event given its index
   * @param {number} eventIndex
   * @returns {{loadedEvent: null, selectedEventId: null, nextEventId: null, selectedPublicEventId: null, nextPublicEventId: null, numEvents: null, titles: {presenterNext: null, titleNow: null, subtitleNow: null, titleNext: null, subtitleNext: null, presenterNow: null, noteNow: null, noteNext: null}, titlesPublic: {presenterNext: null, titleNow: null, subtitleNow: null, titleNext: null, subtitleNext: null, presenterNow: null}, selectedEventIndex: null}}
   */
  loadByIndex(eventIndex) {
    const event = EventLoader.getEventAtIndex(eventIndex);
    return this.loadEvent(event);
  }

  /**
   * finds the previous event
   * @return {object | undefined}
   */
  findPrevious() {
    const timedEvents = EventLoader.getPlayableEvents();
    if (timedEvents === null || !timedEvents.length || this.loaded.selectedEventIndex === 0) {
      return null;
    }

    // if there is no event running, go to first
    if (this.loaded.selectedEventIndex === null) {
      return timedEvents[0];
    }

    const newIndex = this.loaded.selectedEventIndex - 1;
    return timedEvents?.[newIndex];
  }

  /**
   * finds the next event
   * @return {object | undefined}
   */
  findNext() {
    const timedEvents = EventLoader.getPlayableEvents();
    if (timedEvents === null || !timedEvents.length || this.loaded.selectedEventIndex === this.loaded.numEvents - 1) {
      return null;
    }

    // if there is no event running, go to first
    if (this.loaded.selectedEventIndex === null) {
      return timedEvents[0];
    }
    const newIndex = this.loaded.selectedEventIndex + 1;
    return timedEvents?.[newIndex];
  }

  /**
   * finds next event within Roll context
   * @param {number} timeNow - current time in ms
   */
  findRoll(timeNow) {
    const timedEvents = EventLoader.getPlayableEvents();
    if (!timedEvents.length) {
      return null;
    }

    const { nowIndex, timeToNext, nextEvent, nextPublicEvent, currentEvent, currentPublicEvent } = getRollTimers(
      timedEvents,
      timeNow,
    );

    // load events
    this.eventNow = currentEvent;
    this.publicEventNow = currentPublicEvent;
    this.eventNext = nextEvent;
    this.publicEventNext = nextPublicEvent;

    // loaded data summary
    this.loaded.selectedEventIndex = nowIndex;
    this.loaded.selectedEventId = currentEvent?.id || null;
    this.loaded.numEvents = timedEvents.length;
    this.loaded.nextEventId = nextEvent?.id || null;
    this.loaded.nextPublicEventId = nextPublicEvent?.id || null;

    this._loadEvent();

    return { currentEvent, nextEvent, timeToNext };
  }

  /**
   * returns data for currently loaded event
   * @returns {{loadedEvent: null, selectedEventId: (null|*), nextEventId: (null|*), selectedPublicEventId: (null|*), nextPublicEventId: (null|*), numEvents: (null|number|*), titles: (*|{presenterNext: null, titleNow: null, subtitleNow: null, titleNext: null, subtitleNext: null, presenterNow: null, noteNow: null, noteNext: null}), titlesPublic: (*|{presenterNext: null, titleNow: null, subtitleNow: null, titleNext: null, subtitleNext: null, presenterNow: null}), selectedEventIndex: (null|number|*)}}
   */
  getLoaded() {
    return {
      loaded: this.loaded,
      eventNow: this.eventNow,
      publicEventNow: this.publicEventNow,
      eventNext: this.eventNext,
      publicEventNext: this.publicEventNext,
    };
  }

  /**
   * Forces event loader to update the event count
   */
  updateNumEvents() {
    this.loaded.numEvents = EventLoader.getPlayableEvents().length;
    eventStore.set('loaded', this.loaded);
  }

  /**
   * Resets instance state
   */
  reset(emit = true) {
    this.eventNow = null;
    this.publicEventNow = null;
    this.eventNext = null;
    this.publicEventNext = null;
    this.loaded = {
      selectedEventIndex: null,
      selectedEventId: null,
      selectedPublicEventId: null,
      nextEventId: null,
      nextPublicEventId: null,
      numEvents: EventLoader.getPlayableEvents().length,
    };

    // workaround for socket not being ready in constructor
    if (emit) {
      this._loadEvent();
    }
  }

  /**
   * loads an event given its id
   * @param {object} event
   */
  loadEvent(event?: OntimeEvent) {
    if (typeof event === 'undefined') {
      return null;
    }
    const timedEvents = EventLoader.getPlayableEvents();
    const eventIndex = timedEvents.findIndex((eventInMemory) => eventInMemory.id === event.id);
    const playableEvents = EventLoader.getPlayableEvents();

    // we know some stuff now
    this.loaded.selectedEventIndex = eventIndex;
    this.loaded.selectedEventId = event.id;
    this.loaded.numEvents = timedEvents.length;
    this.eventNow = event;
    this._loadEventNow(event, playableEvents);
    this._loadEventNext(playableEvents);

    this._loadEvent();

    return this.getLoaded();
  }

  /**
   * Handle side effects from event loading
   */
  private _loadEvent() {
    eventStore.batchSet({
      loaded: this.loaded,
      eventNow: this.eventNow,
      publicEventNow: this.publicEventNow,
      eventNext: this.eventNext,
      publicEventNext: this.publicEventNext,
    });
  }

  /**
   * @description loads currently running events
   * @private
   * @param {object} event
   * @param {array} rundown
   */
  private _loadEventNow(event, rundown) {
    this.eventNow = event;

    // check if current is also public
    if (event.isPublic) {
      this.publicEventNow = event;
      this.loaded.selectedPublicEventId = event.id;
    } else {
      // assume there is no public event
      this.publicEventNow = null;
      this.loaded.selectedPublicEventId = null;

      // if there is nothing before, return
      if (this.loaded.selectedEventIndex === 0) return;

      // iterate backwards to find it
      for (let i = this.loaded.selectedEventIndex; i >= 0; i--) {
        if (rundown[i].isPublic) {
          this.publicEventNow = rundown[i];
          this.loaded.selectedPublicEventId = rundown[i].id;
          break;
        }
      }
    }
  }

  /**
   * @description look for next events
   * @private
   */
  private _loadEventNext(rundown) {
    // assume there are no next events
    this.eventNext = null;
    this.publicEventNext = null;
    this.loaded.nextEventId = null;
    this.loaded.nextPublicEventId = null;

    if (this.loaded.selectedEventIndex === null) return;

    const numEvents = rundown.length;

    if (this.loaded.selectedEventIndex < numEvents - 1) {
      let nextPublic = false;
      let nextProduction = false;

      for (let i = this.loaded.selectedEventIndex + 1; i < numEvents; i++) {
        // if we have not set private
        if (!nextProduction) {
          this.eventNext = rundown[i];
          this.loaded.nextEventId = rundown[i].id;
          nextProduction = true;
        }

        // if event is public
        if (rundown[i].isPublic) {
          this.publicEventNext = rundown[i];
          this.loaded.nextPublicEventId = rundown[i].id;
          nextPublic = true;
        }

        // Stop if both are set
        if (nextPublic && nextProduction) break;
      }
    }
  }
}

export const eventLoader = new EventLoader();
