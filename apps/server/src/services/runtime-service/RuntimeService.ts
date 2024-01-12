import { LogOrigin, OntimeEvent, Playback } from 'ontime-types';
import { validatePlayback } from 'ontime-utils';

import { eventLoader, EventLoader } from '../../classes/event-loader/EventLoader.js';
import { eventStore } from '../../stores/EventStore.js';
import { eventTimer } from '../TimerService.js';
import { clock } from '../Clock.js';
import { logger } from '../../classes/Logger.js';
import { RestorePoint } from '../RestoreService.js';
import { state, stateMutations } from '../../state.js';

/**
 * Service manages playback status of app
 * Coordinating with necessary services
 */
class RuntimeService {
  constructor() {}

  /**
   * makes calls for loading and starting given event
   * @param {OntimeEvent} event
   * @return {boolean} success
   */
  loadEvent(event: OntimeEvent): boolean {
    let success = false;

    if (!event) {
      logger.error(LogOrigin.Playback, 'No event found');
    } else if (event.skip) {
      logger.warning(LogOrigin.Playback, `Refused playback of skipped event ID ${event.id}`);
    } else {
      eventLoader.loadEvent(event);
      eventTimer.load(event);
      success = true;
    }
    eventStore.broadcast();
    return success;
  }

  /**
   * starts event matching given ID
   * @param {string} eventId
   * @return {boolean} success
   */
  startById(eventId: string): boolean {
    const event = EventLoader.getEventWithId(eventId);
    const success = this.loadEvent(event);
    if (success) {
      logger.info(LogOrigin.Playback, `Loaded event with ID ${event.id}`);
      this.start();
    }
    return success;
  }

  /**
   * starts an event at index
   * @param {number} eventIndex
   * @return {boolean} success
   */
  startByIndex(eventIndex: number): boolean {
    const event = EventLoader.getEventAtIndex(eventIndex);
    const success = this.loadEvent(event);
    if (success) {
      logger.info(LogOrigin.Playback, `Loaded event with ID ${event.id}`);
      this.start();
    }
    return success;
  }

  /**
   * starts first event matching given cue
   * @param {string} cue
   * @return {boolean} success
   */
  startByCue(cue: string): boolean {
    const event = EventLoader.getEventWithCue(cue);
    const success = this.loadEvent(event);
    if (success) {
      logger.info(LogOrigin.Playback, `Loaded event with ID ${event.id}`);
      this.start();
    }
    return success;
  }

  /**
   * loads event matching given ID
   * @param {string} eventId
   * @return {boolean} success
   */
  loadById(eventId: string): boolean {
    const event = EventLoader.getEventWithId(eventId);
    const success = this.loadEvent(event);
    if (success) {
      logger.info(LogOrigin.Playback, `Loaded event with ID ${event.id}`);
    }
    return success;
  }

  /**
   * loads event matching given ID
   * @param {number} eventIndex
   * @return {boolean} success
   */
  loadByIndex(eventIndex: number): boolean {
    const event = EventLoader.getEventAtIndex(eventIndex);
    const success = this.loadEvent(event);
    if (success) {
      logger.info(LogOrigin.Playback, `Loaded event with ID ${event.id}`);
    }
    return success;
  }

  /**
   * loads first event matching given cue
   * @param {string} cue
   * @return {boolean} success
   */
  loadByCue(cue: string): boolean {
    const event = EventLoader.getEventWithCue(cue);
    const success = this.loadEvent(event);
    if (success) {
      logger.info(LogOrigin.Playback, `Loaded event with ID ${event.id}`);
    }
    return success;
  }

  /**
   * Loads event before currently selected
   */
  loadPrevious() {
    const previousEvent = eventLoader.findPrevious();
    if (previousEvent) {
      const success = this.loadEvent(previousEvent);
      if (success) {
        logger.info(LogOrigin.Playback, `Loaded event with ID ${previousEvent.id}`);
      }
    }
  }

  /**
   * Loads event after currently selected
   * @param {string} [fallbackAction] - 'stop', 'pause'
   * @return {boolean} success
   */
  loadNext(fallbackAction?: 'stop' | 'pause'): boolean {
    const nextEvent = eventLoader.findNext();
    if (nextEvent) {
      const success = this.loadEvent(nextEvent);
      if (success) {
        logger.info(LogOrigin.Playback, `Loaded event with ID ${nextEvent.id}`);
        return true;
      }
    } else if (fallbackAction === 'stop') {
      logger.info(LogOrigin.Playback, 'No next event found! Stopping playback');
      this.stop();
      return false;
    } else if (fallbackAction === 'pause') {
      logger.info(LogOrigin.Playback, 'No next event found! Pausing playback');
      this.pause();
      return false;
    } else {
      logger.info(LogOrigin.Playback, 'No next event found! Continuing playback');
      return false;
    }
  }

  /**
   * Starts playback on selected event
   */
  start() {
    if (validatePlayback(state.playback).start) {
      eventTimer.start();
      const newState = state.playback;
      logger.info(LogOrigin.Playback, `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Starts playback on next event
   * @param {string} [fallbackAction] - 'stop', 'pause'
   */
  startNext(fallbackAction?: 'stop' | 'pause') {
    const success = this.loadNext(fallbackAction);
    if (success) {
      this.start();
    }
  }

  /**
   * Pauses playback on selected event
   */
  pause() {
    if (validatePlayback(state.playback).pause) {
      eventTimer.pause();
      const newState = state.playback;
      logger.info(LogOrigin.Playback, `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Stops timer and unloads any events
   */
  stop() {
    if (validatePlayback(state.playback).stop) {
      eventLoader.reset();
      eventTimer.stop();
      const newState = state.playback;
      logger.info(LogOrigin.Playback, `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Reloads current event
   */
  reload() {
    if (state.timer.selectedEventId) {
      this.loadById(state.timer.selectedEventId);
    }
  }

  /**
   * Sets playback to roll
   */
  roll() {
    if (EventLoader.getPlayableEvents()) {
      const rollTimers = eventLoader.findRoll(clock.timeNow());

      // nothing to play
      if (rollTimers === null) {
        logger.warning(LogOrigin.Server, 'Roll: no events found');
        this.stop();
        return;
      }

      const { currentEvent, nextEvent } = rollTimers;
      if (!currentEvent && !nextEvent) {
        logger.warning(LogOrigin.Server, 'Roll: no events found');
        this.stop();
        return;
      }

      eventTimer.roll(currentEvent, nextEvent);

      const newState = state.playback;
      logger.info(LogOrigin.Playback, `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * @description resume playback state given a restore point
   * @param restorePoint
   */
  resume(restorePoint: RestorePoint) {
    const willResume = () => logger.info(LogOrigin.Server, 'Resuming playback');

    if (restorePoint.playback === Playback.Roll) {
      willResume();
      this.roll();
    }

    if (restorePoint.selectedEventId) {
      const event = EventLoader.getEventWithId(restorePoint.selectedEventId);
      // the db would have to change for the event not to exist
      // we do not kow the reason for the crash, so we check anyway
      if (!event) {
        return;
      }

      eventLoader.loadEvent(event);
      eventTimer.resume(event, restorePoint);
      eventStore.broadcast();
      return;
    }
  }

  /**
   * Adds time to current event
   * @param {number} time - time to add in seconds
   */
  addTime(time: number) {
    if (state.timer.selectedEventId) {
      const timeInMs = time * 1000;
      eventTimer.addTime(timeInMs);
      timeInMs > 0
        ? logger.info(LogOrigin.Playback, `Added ${time} sec`)
        : logger.info(LogOrigin.Playback, `Removed ${time} sec`);
    }
  }
}

export const runtimeService = new RuntimeService();
