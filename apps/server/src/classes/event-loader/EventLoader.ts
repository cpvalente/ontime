import { Loaded, OntimeEvent, TitleBlock } from 'ontime-types';

import { DataProvider } from '../data-provider/DataProvider.js';
import { getRollTimers } from '../../services/rollUtils.js';
import { eventStore } from '../../stores/EventStore.js';

let instance;

/**
 * Manages business logic around loading events
 */
export class EventLoader {
  loadedEvent: OntimeEvent | null;
  loaded: Loaded;
  titles: TitleBlock;
  titlesPublic: TitleBlock;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;
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
    // return mockLoaderData.filter((event) => event.type === 'event');
    return DataProvider.getRundown().filter((event) => event.type === 'event');
  }

  /**
   * returns all events that can be loaded
   * @return {array}
   */
  static getPlayableEvents(): OntimeEvent[] {
    // return mockLoaderData.filter((event) => event.type === 'event' && !event.skip);
    return DataProvider.getRundown().filter((event) => event.type === 'event' && !event.skip);
  }

  /**
   * returns number of events
   * @return {number}
   */
  static getNumEvents() {
    return EventLoader.getTimedEvents().length;
  }

  /**
   * returns an event given its index
   * @param {number} eventIndex
   * @return {OntimeEvent | undefined}
   */
  static getEventAtIndex(eventIndex: number): OntimeEvent | undefined {
    const timedEvents = EventLoader.getTimedEvents();
    return timedEvents?.[eventIndex];
  }

  /**
   * returns an event given its index
   * @param {number} eventIndex
   * @return {object | undefined}
   */
  static getPlayableAtIndex(eventIndex) {
    const timedEvents = EventLoader.getPlayableEvents();
    return timedEvents?.[eventIndex];
  }

  /**
   * returns an event given its id
   * @param {string} eventId
   * @return {object | undefined}
   */
  static getEventWithId(eventId) {
    const timedEvents = EventLoader.getTimedEvents();
    return timedEvents.find((event) => event.id === eventId);
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

    this.loadedEvent = currentEvent;
    this.loaded.selectedEventIndex = nowIndex;
    this.loaded.selectedEventId = currentEvent?.id || null;
    this.loaded.numEvents = timedEvents.length;

    // titles
    this._loadThisTitles(currentEvent, 'now-private');
    this._loadThisTitles(currentPublicEvent, 'now-public');
    this._loadThisTitles(nextEvent, 'next-private');
    this._loadThisTitles(nextPublicEvent, 'next-public');

    return { currentEvent, nextEvent, timeToNext };
  }

  /**
   * returns data for currently loaded event
   * @returns {{loadedEvent: null, selectedEventId: (null|*), nextEventId: (null|*), selectedPublicEventId: (null|*), nextPublicEventId: (null|*), numEvents: (null|number|*), titles: (*|{presenterNext: null, titleNow: null, subtitleNow: null, titleNext: null, subtitleNext: null, presenterNow: null, noteNow: null, noteNext: null}), titlesPublic: (*|{presenterNext: null, titleNow: null, subtitleNow: null, titleNext: null, subtitleNext: null, presenterNow: null}), selectedEventIndex: (null|number|*)}}
   */
  getLoaded() {
    return {
      loadedEvent: this.loadedEvent,
      loaded: this.loaded,
      titles: this.titles,
      titlesPublic: this.titlesPublic,
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
    this.loadedEvent = null;
    this.loaded = {
      selectedEventIndex: null,
      selectedEventId: null,
      selectedPublicEventId: null,
      nextEventId: null,
      nextPublicEventId: null,
      numEvents: EventLoader.getPlayableEvents().length,
    };
    this.titles = {
      titleNow: null,
      subtitleNow: null,
      presenterNow: null,
      noteNow: null,
      titleNext: null,
      subtitleNext: null,
      presenterNext: null,
      noteNext: null,
    };
    this.titlesPublic = {
      titleNow: null,
      subtitleNow: null,
      presenterNow: null,
      noteNow: null,
      titleNext: null,
      subtitleNext: null,
      presenterNext: null,
      noteNext: null,
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
  loadEvent(event) {
    if (typeof event === 'undefined') {
      return null;
    }
    const timedEvents = EventLoader.getPlayableEvents();
    const eventIndex = timedEvents.findIndex((eventInMemory) => eventInMemory.id === event.id);
    const playableEvents = EventLoader.getPlayableEvents();

    // we know some stuff now
    this.loadedEvent = event;
    this.loaded.selectedEventIndex = eventIndex;
    this.loaded.selectedEventId = event.id;
    this.loaded.numEvents = timedEvents.length;
    // this.nextEventId = playableEvents[eventIndex + 1].id;
    this._loadTitlesNow(event, playableEvents);
    this._loadTitlesNext(playableEvents);

    this._loadEvent();

    return this.getLoaded();
  }

  /**
   * Handle side effects from event loading
   */
  private _loadEvent() {
    eventStore.batchSet({
      loaded: this.loaded,
      titles: this.titles,
      titlesPublic: this.titlesPublic,
    });
  }

  /**
   * @description loads given title (now)
   * @private
   * @param {object} event
   * @param {array} rundown
   */
  private _loadTitlesNow(event, rundown) {
    // private title is always current
    // check if current is also public
    if (event.isPublic) {
      this._loadThisTitles(event, 'now');
    } else {
      this._loadThisTitles(event, 'now-private');

      // assume there is no public event
      this.titlesPublic.titleNow = null;
      this.titlesPublic.subtitleNow = null;
      this.titlesPublic.presenterNow = null;
      this.loaded.selectedPublicEventId = null;

      // if there is nothing before, return
      if (this.loaded.selectedEventIndex === 0) return;

      // iterate backwards to find it
      for (let i = this.loaded.selectedEventIndex; i >= 0; i--) {
        if (rundown[i].isPublic) {
          this._loadThisTitles(rundown[i], 'now-public');
          break;
        }
      }
    }
  }

  /**
   * @description look for next titles to load
   * @private
   */
  private _loadTitlesNext(rundown) {
    // maybe there is nothing to load
    if (this.loaded.selectedEventIndex === null) return;

    // assume there is no next event
    this.titles.titleNext = null;
    this.titles.subtitleNext = null;
    this.titles.presenterNext = null;
    this.titles.noteNext = null;
    this.loaded.nextEventId = null;

    this.titlesPublic.titleNext = null;
    this.titlesPublic.subtitleNext = null;
    this.titlesPublic.presenterNext = null;
    this.loaded.nextPublicEventId = null;

    const numEvents = rundown.length;

    if (this.loaded.selectedEventIndex < numEvents - 1) {
      let nextPublic = false;
      let nextPrivate = false;

      for (let i = this.loaded.selectedEventIndex + 1; i < numEvents; i++) {
        // if we have not set private
        if (!nextPrivate) {
          this._loadThisTitles(rundown[i], 'next-private');
          nextPrivate = true;
        }

        // if event is public
        if (rundown[i].isPublic) {
          this._loadThisTitles(rundown[i], 'next-public');
          nextPublic = true;
        }

        // Stop if both are set
        if (nextPublic && nextPrivate) break;
      }
    }
  }

  /**
   * @description loads given title
   * @param event
   * @param type
   * @private
   */
  private _loadThisTitles(event, type) {
    if (!event) {
      return;
    }

    switch (type) {
      // now, load to both public and private
      case 'now':
        // public
        this.titlesPublic.titleNow = event.title;
        this.titlesPublic.subtitleNow = event.subtitle;
        this.titlesPublic.presenterNow = event.presenter;
        this.titlesPublic.noteNow = event.note;
        this.loaded.selectedPublicEventId = event.id;

        // private
        this.titles.titleNow = event.title;
        this.titles.subtitleNow = event.subtitle;
        this.titles.presenterNow = event.presenter;
        this.titles.noteNow = event.note;
        this.loaded.selectedEventId = event.id;
        break;

      case 'now-public':
        this.titlesPublic.titleNow = event.title;
        this.titlesPublic.subtitleNow = event.subtitle;
        this.titlesPublic.presenterNow = event.presenter;
        this.titlesPublic.noteNow = event.note;
        this.loaded.selectedPublicEventId = event.id;
        break;

      case 'now-private':
        this.titles.titleNow = event.title;
        this.titles.subtitleNow = event.subtitle;
        this.titles.presenterNow = event.presenter;
        this.titles.noteNow = event.note;
        this.loaded.selectedEventId = event.id;
        break;

      // next, load to both public and private
      case 'next':
        // public
        this.titlesPublic.titleNext = event.title;
        this.titlesPublic.subtitleNext = event.subtitle;
        this.titlesPublic.presenterNext = event.presenter;
        this.titlesPublic.noteNext = event.note;
        this.loaded.nextPublicEventId = event.id;

        // private
        this.titles.titleNext = event.title;
        this.titles.subtitleNext = event.subtitle;
        this.titles.presenterNext = event.presenter;
        this.titles.noteNext = event.note;
        this.loaded.nextEventId = event.id;
        break;

      case 'next-public':
        this.titlesPublic.titleNext = event.title;
        this.titlesPublic.subtitleNext = event.subtitle;
        this.titlesPublic.presenterNext = event.presenter;
        this.titlesPublic.noteNext = event.note;
        this.loaded.nextPublicEventId = event.id;
        break;

      case 'next-private':
        this.titles.titleNext = event.title;
        this.titles.subtitleNext = event.subtitle;
        this.titles.presenterNext = event.presenter;
        this.titles.noteNext = event.note;
        this.loaded.nextEventId = event.id;
        break;

      default:
        throw new Error(`Unhandled title type: ${type}`);
    }
  }
}

export const eventLoader = new EventLoader();
