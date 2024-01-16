import { LogOrigin, OntimeEvent, Playback } from 'ontime-types';
import { millisToString, validatePlayback } from 'ontime-utils';

import { EventLoader } from '../../classes/event-loader/EventLoader.js';
import { TimerService } from '../TimerService.js';
import { logger } from '../../classes/Logger.js';
import { RestorePoint } from '../RestoreService.js';
import { state, stateMutations } from '../../state.js';

/**
 * Service manages runtime status of app
 * Coordinating with necessary services
 */
class RuntimeService {
  private eventTimer: TimerService;

  constructor() {}

  init(resumable: RestorePoint | null) {
    logger.info(LogOrigin.Server, 'Runtime service started');
    // TODO: refresh at 32ms, slowing down now to keep UI responsive while we dont have granular updates
    // calculate at 30fps, refresh at 1fps
    this.eventTimer = new TimerService({ refresh: 1000, updateInterval: 1000 });

    if (resumable) {
      this.resume(resumable);
    }
  }

  shutdown() {
    logger.info(LogOrigin.Server, 'Runtime service shutting down');
    this.eventTimer.shutdown();
  }

  /**
   * Checks if a list of IDs is in the current selection
   */
  private affectsLoaded(affectedIds: string[]): boolean {
    const now = state.eventNow.id;
    const nowPublic = state.publicEventNow.id;
    const next = state.eventNext.id;
    const nextPublic = state.publicEventNext.id;
    return (
      affectedIds.includes(now) ||
      affectedIds.includes(nowPublic) ||
      affectedIds.includes(next) ||
      affectedIds.includes(nextPublic)
    );
  }

  private isNewNext() {
    const timedEvents = EventLoader.getPlayableEvents();
    const now = state.eventNow.id;
    const next = state.eventNext.id;

    // check whether the index of now and next are consecutive
    const indexNow = timedEvents.findIndex((event) => event.id === now);
    const indexNext = timedEvents.findIndex((event) => event.id === next);

    if (indexNext - indexNow !== 1) {
      return true;
    }
    // iterate through timed events and see if there are public events between nowPublic and nextPublic
    const nowPublic = state.publicEventNow.id;
    const nextPublic = state.publicEventNext.id;

    let foundNew = false;
    let isAfter = false;
    for (const event of timedEvents) {
      if (!isAfter) {
        if (event.id === nowPublic) {
          isAfter = true;
        }
      } else {
        if (event.id === nextPublic) {
          break;
        }
        if (event.isPublic) {
          foundNew = true;
          break;
        }
      }
    }

    return foundNew;
  }

  reset() {
    stateMutations.timer.clear();
  }

  /**
   * check whether underlying data of runtime has changed
   */
  update(affectedIds?: string[]) {
    const hasLoadedElements = state.eventNow && state.eventNext;
    if (!hasLoadedElements) {
      return;
    }

    // we need to reload in a few scenarios:
    // 1. we are not confident that changes do not affect running event
    const safeOption = typeof affectedIds === 'undefined';
    // 2. the edited event is in memory (now or next) running
    const eventInMemory = safeOption ? false : this.affectsLoaded(affectedIds);
    // 3. the edited event replaces next event
    let isNext = false;

    if (safeOption || eventInMemory) {
      if (state.timer.playback === Playback.Roll) {
        this.roll();
      }
      // load stuff again, but keep running if our events still exist
      const eventNow = EventLoader.getEventWithId(state.eventNow.id);
      if (eventNow) {
        stateMutations.reload(eventNow);
      }
      return;
    }

    isNext = this.isNewNext();
    if (isNext) {
      // TODO: do i need to load here?
      const playableEvents = EventLoader.getPlayableEvents();
      stateMutations.loadNext(playableEvents);
    }
  }

  /**
   * makes calls for loading and starting given event
   * @param {OntimeEvent} event
   * @return {boolean} success - whether an event was loaded
   */
  loadEvent(event: OntimeEvent): boolean {
    if (event.skip) {
      logger.warning(LogOrigin.Playback, `Refused skipped event with ID ${event.id}`);
      return false;
    }

    const timedEvents = EventLoader.getPlayableEvents();
    stateMutations.load(event, timedEvents);
    const success = event.id === state.eventNow.id;

    if (success) {
      logger.info(LogOrigin.Playback, `Loaded event with ID ${event.id}`);
    }
    return success;
  }

  /**
   * starts event matching given ID
   * @param {string} eventId
   * @return {boolean} success - whether an event was loaded
   */
  startById(eventId: string): boolean {
    const event = EventLoader.getEventWithId(eventId);
    const success = this.loadEvent(event);
    if (success) {
      this.start();
    }
    return success;
  }

  /**
   * starts an event at index
   * @param {number} eventIndex
   * @return {boolean} success - whether an event was loaded
   */
  startByIndex(eventIndex: number): boolean {
    const event = EventLoader.getEventAtIndex(eventIndex);
    const success = this.loadEvent(event);
    if (success) {
      this.start();
    }
    return success;
  }

  /**
   * starts first event matching given cue
   * @param {string} cue
   * @return {boolean} success - whether an event was loaded
   */
  startByCue(cue: string): boolean {
    const event = EventLoader.getEventWithCue(cue);
    const success = this.loadEvent(event);
    if (success) {
      this.start();
    }
    return success;
  }

  /**
   * loads event matching given ID
   * @param {string} eventId
   * @return {boolean} success - whether an event was loaded
   */
  loadById(eventId: string): boolean {
    const event = EventLoader.getEventWithId(eventId);
    const success = this.loadEvent(event);
    return success;
  }

  /**
   * loads event matching given ID
   * @param {number} eventIndex
   * @return {boolean} success - whether an event was loaded
   */
  loadByIndex(eventIndex: number): boolean {
    const event = EventLoader.getEventAtIndex(eventIndex);
    const success = this.loadEvent(event);
    return success;
  }

  /**
   * loads first event matching given cue
   * @param {string} cue
   * @return {boolean} success - whether an event was loaded
   */
  loadByCue(cue: string): boolean {
    const event = EventLoader.getEventWithCue(cue);
    const success = this.loadEvent(event);
    return success;
  }

  /**
   * Loads event before currently selected
   * @return {boolean} success - whether an event was loaded
   */
  loadPrevious(): boolean {
    const previousEvent = EventLoader.findPrevious(state.eventNow.id);
    if (previousEvent) {
      const success = this.loadEvent(previousEvent);
      return success;
    }
    return false;
  }

  /**
   * Loads event after currently selected
   * @return {boolean} success
   */
  loadNext(): boolean {
    const nextEvent = EventLoader.findNext(state.eventNow.id);
    if (nextEvent) {
      const success = this.loadEvent(nextEvent);
      return success;
    }

    logger.info(LogOrigin.Playback, 'No next event found! Continuing playback');
    return false;
  }

  /**
   * Starts playback on selected event
   */
  start() {
    const canStart = validatePlayback(state.timer.playback).start;
    if (canStart) {
      this.eventTimer.start();
      logger.info(LogOrigin.Playback, `Play Mode ${state.timer.playback.toUpperCase()}`);
    }
  }

  /**
   * Starts playback on next event
   */
  startNext() {
    const hasNext = this.loadNext();
    if (hasNext) {
      this.start();
    }
  }

  /**
   * Pauses playback on selected event
   */
  pause() {
    if (validatePlayback(state.timer.playback).pause) {
      this.eventTimer.pause();
      const newState = state.timer.playback;
      logger.info(LogOrigin.Playback, `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Stops timer and unloads any events
   */
  stop() {
    if (validatePlayback(state.timer.playback).stop) {
      this.eventTimer.stop();
      const newState = state.timer.playback;
      logger.info(LogOrigin.Playback, `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Reloads current event
   */
  reload() {
    if (state.eventNow) {
      stateMutations.reload();
    }
  }

  /**
   * Sets playback to roll
   */
  roll() {
    const playableEvents = EventLoader.getPlayableEvents();
    try {
      this.eventTimer.roll(playableEvents);
    } catch (error) {
      logger.warning(LogOrigin.Server, `Roll: ${error}`);
    }

    const newState = state.timer.playback;
    logger.info(LogOrigin.Playback, `Play Mode ${newState.toUpperCase()}`);
  }

  /**
   * @description resume playback state given a restore point
   * @param restorePoint
   */
  resume(restorePoint: RestorePoint) {
    const { selectedEventId, playback } = restorePoint;
    if (playback === Playback.Roll) {
      this.roll();
    }

    // the db would have to change for the event not to exist
    // we do not kow the reason for the crash, so we check anyway
    const event = EventLoader.getEventWithId(selectedEventId);
    if (!event) {
      return;
    }

    const timedEvents = EventLoader.getPlayableEvents();
    stateMutations.resume(restorePoint, event, timedEvents);
    logger.info(LogOrigin.Playback, 'Resuming playback');
  }

  /**
   * Adds time to current event
   * @param {number} time - time to add in milliseconds
   */
  addTime(time: number) {
    this.eventTimer.addTime(time);
    logger.info(LogOrigin.Playback, `${time > 0 ? 'Added' : 'Removed'} ${millisToString(time)}`);
  }
}

export const runtimeService = new RuntimeService();
