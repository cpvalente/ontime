/**
 * starts loaded timer
 */
import { socketProvider } from '../classes/socket/SocketController.js';
import { eventLoader, EventLoader } from '../classes/event-loader/EventLoader.js';
import { eventTimer, TimerService } from './TimerService.ts';

/**
 * Service manages playback status of app
 * Coordinating with necessary services
 */
export class PlaybackService {
  /**
   * makes calls for loading and starting given event
   * @param {object} event
   * @return {boolean} success
   */
  static loadEvent(event) {
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
    socketProvider.broadcastState();
    return success;
  }

  /**
   * starts event matching given ID
   * @param {string} eventId
   * @return {boolean} success
   */
  static startById(eventId) {
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
  static startByIndex(eventIndex) {
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
  static loadById(eventId) {
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
  static loadByIndex(eventIndex) {
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
   */
  static loadNext() {
    const nextEvent = eventLoader.findNext();
    if (nextEvent) {
      const success = PlaybackService.loadEvent(nextEvent);
      if (success) {
        socketProvider.info('PLAYBACK', `Loaded event with ID ${nextEvent.id}`);
      }
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
    socketProvider.broadcastState();
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
    socketProvider.broadcastState();
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
    socketProvider.broadcastState();
  }

  /**
   * Reloads current event
   */
  static reload() {
    if (eventLoader.selectedEventId) {
      this.loadById(eventLoader.selectedEventId);
    }
    socketProvider.broadcastState();
  }

  /**
   * Sets playback to roll
   */
  static roll() {
    if (EventLoader.getPlayableEvents()) {
      const rollTimers = eventLoader.findRoll(TimerService.getCurrentTime());

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
      socketProvider.broadcastState();
    }
  }

  /**
   * Adds delay to current event
   * @param {number} delayTime time in minutes
   */
  static setDelay(delayTime) {
    if (eventLoader.selectedEventId) {
      const delayInMs = delayTime * 1000 * 60;
      eventTimer.delay(delayInMs);
      socketProvider.info('PLAYBACK', `Added ${delayTime} min delay`);
    }
    socketProvider.broadcastState();
  }
}
