import { DataProvider } from '../data-provider/DataProvider.js';
import { getRollTimers } from '../../services/rollUtils.js';
import { runtimeState } from '../../stores/EventStore.js';

let instance;

type TitleBlock = {
  titleNow: string | null;
  subtitleNow: string | null;
  presenterNow: string | null;
  noteNow: string | null;
  titleNext: string | null;
  subtitleNext: string | null;
  presenterNext: string | null;
  noteNext: string | null;
};

/**
 * Manages business logic around loading events
 */
export class EventLoader {
  loadedEvent: object | null;
  numEvents: number | null;
  selectedEventIndex: number | null;
  selectedEventId: string | null;
  selectedPublicEventId: string | null;
  nextEventId: string | null;
  nextPublicEventId: string | null;
  titles: TitleBlock;
  titlesPublic: TitleBlock;

  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this logic is used to ensure singleton
    instance = this;
    this.reset(false);
    this.loadedEvent = null;
  }

  /**
   * returns all events that contain time data
   * @return {array}
   */
  static getTimedEvents() {
    // return mockLoaderData.filter((event) => event.type === 'event');
    return DataProvider.getRundown().filter((event) => event.type === 'event');
  }

  /**
   * returns all events that can be loaded
   * @return {array}
   */
  static getPlayableEvents() {
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
   * @return {object | undefined}
   */
  static getEventAtIndex(eventIndex) {
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
    if (timedEvents === null || !timedEvents.length || this.selectedEventIndex === 0) {
      return null;
    }

    // if there is no event running, go to first
    if (this.selectedEventIndex === null) {
      return timedEvents[0];
    }

    const newIndex = this.selectedEventIndex - 1;
    return timedEvents?.[newIndex];
  }

  /**
   * finds the next event
   * @return {object | undefined}
   */
  findNext() {
    const timedEvents = EventLoader.getPlayableEvents();
    if (timedEvents === null || !timedEvents.length || this.selectedEventIndex === this.numEvents - 1) {
      return null;
    }

    // if there is no event running, go to first
    if (this.selectedEventIndex === null) {
      return timedEvents[0];
    }
    const newIndex = this.selectedEventIndex + 1;
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

    const { nowIndex, timers, timeToNext, nextEvent, nextPublicEvent, currentEvent, currentPublicEvent } =
      getRollTimers(timedEvents, timeNow);

    this.loadedEvent = currentEvent;
    this.selectedEventIndex = nowIndex;
    this.selectedEventId = currentEvent?.id || null;
    this.numEvents = timedEvents.length;

    // titles
    this._loadThisTitles(currentEvent, 'now-private');
    this._loadThisTitles(currentPublicEvent, 'now-public');
    this._loadThisTitles(nextEvent, 'next-private');
    this._loadThisTitles(nextPublicEvent, 'next-public');

    return { currentEvent, nextEvent, timeToNext, timers };
  }

  /**
   * returns data for currently loaded event
   * @returns {{loadedEvent: null, selectedEventId: (null|*), nextEventId: (null|*), selectedPublicEventId: (null|*), nextPublicEventId: (null|*), numEvents: (null|number|*), titles: (*|{presenterNext: null, titleNow: null, subtitleNow: null, titleNext: null, subtitleNext: null, presenterNow: null, noteNow: null, noteNext: null}), titlesPublic: (*|{presenterNext: null, titleNow: null, subtitleNow: null, titleNext: null, subtitleNext: null, presenterNow: null}), selectedEventIndex: (null|number|*)}}
   */
  getLoaded() {
    return {
      loadedEvent: this.loadedEvent,
      selectedEventIndex: this.selectedEventIndex,
      selectedEventId: this.selectedEventId,
      selectedPublicEventId: this.selectedPublicEventId,
      nextEventId: this.nextEventId,
      nextPublicEventId: this.nextPublicEventId,
      numEvents: this.numEvents,
      titles: this.titles,
      titlesPublic: this.titlesPublic,
    };
  }

  /**
   * Resets instance state
   */
  reset(emit: boolean) {
    this.loadedEvent = null;
    this.selectedEventIndex = null;
    this.selectedEventId = null;
    this.selectedPublicEventId = null;
    this.nextEventId = null;
    this.nextPublicEventId = null;
    this.numEvents = null;
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
    this.selectedEventIndex = eventIndex;
    this.selectedEventId = event.id;
    this.numEvents = timedEvents.length;
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
    runtimeState.set('titles', this.titles);
    runtimeState.set('titlesPublic', this.titlesPublic);
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
      this.selectedPublicEventId = null;

      // if there is nothing before, return
      if (this.selectedEventIndex === 0) return;

      // iterate backwards to find it
      for (let i = this.selectedEventIndex; i >= 0; i--) {
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
    if (this.selectedEventIndex === null) return;

    // assume there is no next event
    this.titles.titleNext = null;
    this.titles.subtitleNext = null;
    this.titles.presenterNext = null;
    this.titles.noteNext = null;
    this.nextEventId = null;

    this.titlesPublic.titleNext = null;
    this.titlesPublic.subtitleNext = null;
    this.titlesPublic.presenterNext = null;
    this.nextPublicEventId = null;

    const numEvents = rundown.length;

    if (this.selectedEventIndex < numEvents - 1) {
      let nextPublic = false;
      let nextPrivate = false;

      for (let i = this.selectedEventIndex + 1; i < numEvents; i++) {
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
        this.selectedPublicEventId = event.id;

        // private
        this.titles.titleNow = event.title;
        this.titles.subtitleNow = event.subtitle;
        this.titles.presenterNow = event.presenter;
        this.titles.noteNow = event.note;
        this.selectedEventId = event.id;
        break;

      case 'now-public':
        this.titlesPublic.titleNow = event.title;
        this.titlesPublic.subtitleNow = event.subtitle;
        this.titlesPublic.presenterNow = event.presenter;
        this.titlesPublic.noteNow = event.note;
        this.selectedPublicEventId = event.id;
        break;

      case 'now-private':
        this.titles.titleNow = event.title;
        this.titles.subtitleNow = event.subtitle;
        this.titles.presenterNow = event.presenter;
        this.titles.noteNow = event.note;
        this.selectedEventId = event.id;
        break;

      // next, load to both public and private
      case 'next':
        // public
        this.titlesPublic.titleNext = event.title;
        this.titlesPublic.subtitleNext = event.subtitle;
        this.titlesPublic.presenterNext = event.presenter;
        this.titlesPublic.noteNext = event.note;
        this.nextPublicEventId = event.id;

        // private
        this.titles.titleNext = event.title;
        this.titles.subtitleNext = event.subtitle;
        this.titles.presenterNext = event.presenter;
        this.titles.noteNext = event.note;
        this.nextEventId = event.id;
        break;

      case 'next-public':
        this.titlesPublic.titleNext = event.title;
        this.titlesPublic.subtitleNext = event.subtitle;
        this.titlesPublic.presenterNext = event.presenter;
        this.titlesPublic.noteNext = event.note;
        this.nextPublicEventId = event.id;
        break;

      case 'next-private':
        this.titles.titleNext = event.title;
        this.titles.subtitleNext = event.subtitle;
        this.titles.presenterNext = event.presenter;
        this.titles.noteNext = event.note;
        this.nextEventId = event.id;
        break;

      default:
        throw new Error(`Unhandled title type: ${type}`);
    }
  }
}

export const eventLoader = new EventLoader();
