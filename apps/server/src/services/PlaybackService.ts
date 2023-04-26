import { OntimeEvent, Playback } from 'ontime-types';

import { eventLoader, EventLoader } from '../classes/event-loader/EventLoader.js';
import { eventStore } from '../stores/EventStore.js';
import { eventTimer } from './TimerService.js';
import { clock } from './Clock.js';
import { logger } from '../classes/Logger.js';

/**
 * Service manages playback status of app
 * Coordinating with necessary services
 */
export class PlaybackService {
  /**
   * makes calls for loading and starting given event
   * @param {OntimeEvent} event
   * @return {boolean} success
   */
  static loadEvent(event: OntimeEvent): boolean {
    let success = false;
    if (!event) {
      logger.error('PLAYBACK', 'No event found');
    } else if (event.skip) {
      logger.warning('PLAYBACK', `Refused playback of skipped event ID ${event.id}`);
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
  static startById(eventId: string): boolean {
    const event = EventLoader.getEventWithId(eventId);
    const success = PlaybackService.loadEvent(event);
    if (success) {
      logger.info('PLAYBACK', `Loaded event with ID ${event.id}`);
      PlaybackService.start();
    }
    return success;
  }

  /**
   * starts an event at index
   * @param {number} eventIndex
   * @return {boolean} success
   */
  static startByIndex(eventIndex: number): boolean {
    const event = EventLoader.getEventAtIndex(eventIndex);
    const success = PlaybackService.loadEvent(event);
    if (success) {
      logger.info('PLAYBACK', `Loaded event with ID ${event.id}`);
      PlaybackService.start();
    }
    return success;
  }

  /**
   * loads event matching given ID
   * @param {string} eventId
   * @return {boolean} success
   */
  static loadById(eventId: string): boolean {
    const event = EventLoader.getEventWithId(eventId);
    const success = PlaybackService.loadEvent(event);
    if (success) {
      logger.info('PLAYBACK', `Loaded event with ID ${event.id}`);
    }
    return success;
  }

  /**
   * loads event matching given ID
   * @param {number} eventIndex
   * @return {boolean} success
   */
  static loadByIndex(eventIndex: number): boolean {
    const event = EventLoader.getEventAtIndex(eventIndex);
    const success = PlaybackService.loadEvent(event);
    if (success) {
      logger.info('PLAYBACK', `Loaded event with ID ${event.id}`);
    }
    return success;
  }

  /**
   * Loads event before currently selected
   */
  static loadPrevious() {
    const previousEvent = eventLoader.findPrevious();
    if (previousEvent) {
      const success = PlaybackService.loadEvent(previousEvent);
      if (success) {
        logger.info('PLAYBACK', `Loaded event with ID ${previousEvent.id}`);
      }
    }
  }

  /**
   * Loads event after currently selected
   * @param {string} [fallbackAction] - 'stop', 'pause'
   * @return {boolean} success
   */
  static loadNext(fallbackAction?: 'stop' | 'pause'): boolean {
    const nextEvent = eventLoader.findNext();
    if (nextEvent) {
      const success = PlaybackService.loadEvent(nextEvent);
      if (success) {
        logger.info('PLAYBACK', `Loaded event with ID ${nextEvent.id}`);
        return true;
      }
    } else if (fallbackAction === 'stop') {
      logger.info('PLAYBACK', 'No next event found! Stopping playback');
      PlaybackService.stop();
      return false;
    } else if (fallbackAction === 'pause') {
      logger.info('PLAYBACK', 'No next event found! Pausing playback');
      PlaybackService.pause();
      return false;
    } else {
      logger.info('PLAYBACK', 'No next event found! Continuing playback');
      return false;
    }
  }

  /**
   * Starts playback on selected event
   */
  static start() {
    if (eventTimer.playback === Playback.Armed || eventTimer.playback === Playback.Pause) {
      eventTimer.start();
      const newState = eventTimer.playback;
      logger.info('PLAYBACK', `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Starts playback on next event
   * @param {string} [fallbackAction] - 'stop', 'pause'
   */
  static startNext(fallbackAction?: 'stop' | 'pause') {
    const success = PlaybackService.loadNext(fallbackAction);
    if (success) {
      PlaybackService.start();
    }
  }

  /**
   * Pauses playback on selected event
   */
  static pause() {
    if (eventTimer.playback === Playback.Play) {
      eventTimer.pause();
      const newState = eventTimer.playback;
      logger.info('PLAYBACK', `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Stops timer and unloads any events
   */
  static stop() {
    if (eventTimer.playback !== Playback.Stop) {
      eventLoader.reset();
      eventTimer.stop();
      const newState = eventTimer.playback;
      logger.info('PLAYBACK', `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Reloads current event
   */
  static reload() {
    if (eventTimer.loadedTimerId) {
      this.loadById(eventTimer.loadedTimerId);
    }
  }

  /**
   * Sets playback to roll
   */
  static roll() {
    if (EventLoader.getPlayableEvents()) {
      const rollTimers = eventLoader.findRoll(clock.timeNow());

      // nothing to play
      if (rollTimers === null) {
        logger.warning('SERVER', 'Roll: no events found');
        PlaybackService.stop();
        return;
      }

      const { currentEvent, nextEvent } = rollTimers;
      if (!currentEvent && !nextEvent) {
        logger.warning('SERVER', 'Roll: no events found');
        PlaybackService.stop();
        return;
      }

      eventTimer.roll(currentEvent, nextEvent);

      const newState = eventTimer.playback;
      logger.info('PLAYBACK', `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Adds delay to current event
   * @param {number} delayTime time in minutes
   */
  static setDelay(delayTime: number) {
    if (eventTimer.loadedTimerId) {
      const delayInMs = delayTime * 1000 * 60;
      eventTimer.delay(delayInMs);
      delayInMs > 0
        ? logger.info('PLAYBACK', `Added ${delayTime} min delay`)
        : logger.info('PLAYBACK', `Removed ${delayTime} min delay`);
    }
  }
}
