/**
 * starts loaded timer
 */
import { socketProvider } from '../classes/socket/SocketController.js';
import { OntimeEvent } from 'ontime-types';
import { eventLoader, EventLoader } from '../classes/event-loader/EventLoader.js';
import { eventStore } from '../stores/EventStore.js';
import { eventTimer } from './TimerService.js';
import { clock } from './Clock.js';

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
      socketProvider.error('PLAYBACK', 'No event found');
    } else if (event.skip) {
      socketProvider.warning('PLAYBACK', `Refused playback of skipped event ID ${event.id}`);
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
      socketProvider.info('PLAYBACK', `Loaded event with ID ${event.id}`);
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
      socketProvider.info('PLAYBACK', `Loaded event with ID ${event.id}`);
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
      socketProvider.info('PLAYBACK', `Loaded event with ID ${event.id}`);
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
      socketProvider.info('PLAYBACK', `Loaded event with ID ${event.id}`);
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
        socketProvider.info('PLAYBACK', `Loaded event with ID ${previousEvent.id}`);
      }
    }
  }

  /**
   * Loads event after currently selected
   * @param {string} [fallbackAction] - 'stop', 'pause', or null
   * @return {boolean} success
   */
  static loadNext(fallbackAction?: 'stop' | 'pause' | null): boolean {
    const nextEvent = eventLoader.findNext();
    if (nextEvent) {
      const success = PlaybackService.loadEvent(nextEvent);
      if (success) {
        socketProvider.info('PLAYBACK', `Loaded event with ID ${nextEvent.id}`);
        return true;
      }
    } else if (fallbackAction === 'stop') {
      socketProvider.info('PLAYBACK', `No next event found! Stopping playback`);
      PlaybackService.stop();
      return false;
    } else if (fallbackAction === 'pause') {
      socketProvider.info('PLAYBACK', `No next event found! Pausing playback`);
      PlaybackService.pause();
      return false;
    } else {
      socketProvider.info('PLAYBACK', `No next event found! Continuing playback`);
      return false;
    }
  }

  /**
   * Starts playback on selected event
   */
  static start() {
    if (eventLoader.selectedEventId) {
      eventTimer.start();
      const newState = eventTimer.playback;
      socketProvider.info('PLAYBACK', `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Starts playback on next event
   * @param {string} [fallbackAction] - 'stop', 'pause', or null
   */
  static startNext(fallbackAction?: 'stop' | 'pause' | null) {
    const success = PlaybackService.loadNext(fallbackAction);
    if (success) {
      PlaybackService.start();
    }
  }

  /**
   * Pauses playback on selected event
   */
  static pause() {
    if (eventLoader.selectedEventId) {
      eventTimer.pause();
      const newState = eventTimer.playback;
      socketProvider.info('PLAYBACK', `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Stops timer and unloads any events
   */
  static stop() {
    if (eventLoader.selectedEventId || eventTimer.playback === 'roll') {
      eventLoader.reset();
      eventTimer.stop();
      const newState = eventTimer.playback;
      socketProvider.info('PLAYBACK', `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Reloads current event
   */
  static reload() {
    if (eventLoader.selectedEventId) {
      this.loadById(eventLoader.selectedEventId);
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
        socketProvider.error('SERVER', 'Roll: no events found');
        PlaybackService.stop();
        return;
      }

      const { currentEvent, nextEvent, timers } = rollTimers;
      if (!currentEvent && !nextEvent) {
        socketProvider.error('SERVER', 'Roll: no events found');
        PlaybackService.stop();
        return;
      }

      eventTimer.roll(currentEvent, nextEvent, timers);

      const newState = eventTimer.playback;
      socketProvider.info('PLAYBACK', `Play Mode ${newState.toUpperCase()}`);
    }
  }

  /**
   * Adds delay to current event
   * @param {number} delayTime time in minutes
   */
  static setDelay(delayTime: number) {
    if (eventLoader.selectedEventId) {
      const delayInMs = delayTime * 1000 * 60;
      eventTimer.delay(delayInMs);
      socketProvider.info('PLAYBACK', `Added ${delayTime} min delay`);
    }
  }
}
