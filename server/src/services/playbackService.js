/**
 * starts loaded timer
 */
import { socketProvider } from '../classes/socket/SocketController.js';
import { eventLoader, EventLoader } from '../classes/event-loader/EventLoader.js';

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
    if (!event) {
      socketProvider.error('PLAYBACK', 'No event found');
      return false;
    }

    if (event.skip) {
      socketProvider.warning('PLAYBACK', `Refused playback of skipped event ID ${event.id}`);
      return false;
    }
    global.timer.setPause();
    global.timer.loadEvent(event);
    return true;
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
      PlaybackService.loadById(previousEvent.id);
      global.timer.previous();
    }
  }

  /**
   * Loads event after currently selected
   */
  static loadNext() {
    const nextEvent = eventLoader.findNext();
    if (nextEvent) {
      PlaybackService.loadById(nextEvent.id);
      global.timer.next();
    }
  }

  /**
   * Starts playback on selected event
   */
  static start() {
    if (!eventLoader.selectedEventId) {
      return;
    }
    const newState = global.timer.setStart();
    if (newState === 'start') {
      socketProvider.info('PLAYBACK', 'Play Mode Start');
    }
    socketProvider.send('playstate', newState);
  }

  /**
   * Pauses playback on selected event
   */
  static pause() {
    if (!eventLoader.selectedEventId) {
      return;
    }
    const newState = global.timer.setPause();
    if (newState === 'pause') {
      socketProvider.info('PLAYBACK', 'Play Mode Paused');
    }
    socketProvider.send('playstate', newState);
  }

  /**
   * Stops timer and unloads any events
   */
  static stop() {
    if (!eventLoader.selectedEventId && global.timer.state !== 'roll') {
      return;
    }
    eventLoader.reset();
    const newState = global.timer.setStop();
    if (newState === 'stop') {
      socketProvider.info('PLAYBACK', 'Play Mode Stopped');
    }
    socketProvider.send('playstate', newState);
  }

  /**
   * Reloads current event
   */
  static reload() {
    if (!eventLoader.selectedEventId) {
      return;
    }
    const newState = global.timer.setReload();
    socketProvider.info('PLAYBACK', 'Reloaded event');
    socketProvider.send('playstate', newState);
  }

  /**
   * Sets playback to roll
   */
  static roll() {
    if (!EventLoader.getNumEvents()) {
      return;
    }

    if (global.timer.state === 'roll') {
      return;
    }

    const newState = global.timer.setRoll();
    if (newState === 'roll') {
      socketProvider.info('PLAYBACK', 'Play Mode Roll');
    }
    socketProvider.send('playstate', newState);
  }

  /**
   * Adds delay to current event
   * @param {number} delayTime time in ms
   */
  static setDelay(delayTime) {
    if (!eventLoader.selectedEventId) {
      return;
    }
    const delayInMs = delayTime * 1000 * 60;
    global.timer.increment(delayInMs);
    socketProvider.info('PLAYBACK', `Added ${delayTime} min delay`);
  }
}
