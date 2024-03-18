import { EndAction, LogOrigin, OntimeEvent, Playback, TimerLifeCycle } from 'ontime-types';
import { millisToString, validatePlayback } from 'ontime-utils';

import { TimerService } from '../TimerService.js';
import { logger } from '../../classes/Logger.js';
import { RestorePoint } from '../RestoreService.js';

import * as runtimeState from '../../stores/runtimeState.js';

import {
  findNext,
  findPrevious,
  getEventAtIndex,
  getEventWithCue,
  getEventWithId,
  getPlayableEvents,
} from '../rundown-service/rundownUtils.js';
import { integrationService } from '../integration-service/IntegrationService.js';
import { timerConfig } from '../../config/config.js';

/**
 * Service manages runtime status of app
 * Coordinating with necessary services
 */
class RuntimeService {
  private eventTimer: TimerService | null = null;
  private lastOnUpdate = -1;

  /** Checks result of an update and notifies integrations as needed */
  checkTimerUpdate({ shouldCallRoll, hasTimerFinished }: runtimeState.UpdateResult) {
    const newState = runtimeState.getState();
    if (hasTimerFinished) {
      integrationService.dispatch(TimerLifeCycle.onFinish);

      // handle end action if there was a timer playing
      // actions are added to the queue stack to ensure that the order of operations is maintained
      if (newState.timer.playback === Playback.Play && newState.eventNow) {
        if (newState.eventNow.endAction === EndAction.Stop) {
          setTimeout(this.stop.bind(this), 0);
        } else if (newState.eventNow.endAction === EndAction.LoadNext) {
          setTimeout(this.loadNext.bind(this), 0);
        } else if (newState.eventNow.endAction === EndAction.PlayNext) {
          setTimeout(this.startNext.bind(this), 0);
        } else if (newState.eventNow.endAction === EndAction.Pause) {
          setTimeout(this.pause.bind(this), 0);
        }
      }
    }

    // update normal cycle
    if (newState.clock - this.lastOnUpdate >= timerConfig.notificationRate) {
      const hasRunningTimer = Boolean(newState.eventNow) && newState.timer.playback === Playback.Play;
      if (hasRunningTimer) {
        integrationService.dispatch(TimerLifeCycle.onUpdate);
      }

      integrationService.dispatch(TimerLifeCycle.onClock);
      this.lastOnUpdate = newState.clock;
    }

    if (shouldCallRoll) {
      // we dont call this.roll because we need to bypass the checks
      const rundown = getPlayableEvents();
      this.eventTimer.roll(rundown);
    }
  }

  /** delay initialisation until we have a restore point */
  init(resumable: RestorePoint | null) {
    logger.info(LogOrigin.Server, 'Runtime service started');
    // calculate at 30fps, refresh at 1fps
    this.eventTimer = new TimerService({
      refresh: timerConfig.updateRate,
      updateInterval: timerConfig.notificationRate,
      onUpdateCallback: (updateResult) => this.checkTimerUpdate(updateResult),
    });

    if (resumable) {
      this.resume(resumable);
    }
  }

  shutdown() {
    if (this.eventTimer) {
      logger.info(LogOrigin.Server, 'Runtime service shutting down');
      this.eventTimer.shutdown();
    }
  }

  /**
   * Checks if a list of IDs is in the current selection
   */
  private affectsLoaded(affectedIds: string[]): boolean {
    const state = runtimeState.getState();
    const now = state.eventNow?.id;
    const nowPublic = state.publicEventNow?.id;
    const next = state.eventNext?.id;
    const nextPublic = state.publicEventNext?.id;
    return (
      affectedIds.includes(now) ||
      affectedIds.includes(nowPublic) ||
      affectedIds.includes(next) ||
      affectedIds.includes(nextPublic)
    );
  }

  private isNewNext() {
    const timedEvents = getPlayableEvents();
    const state = runtimeState.getState();
    const now = state.eventNow?.id;
    const next = state.eventNext?.id;

    // check whether the index of now and next are consecutive
    const indexNow = timedEvents.findIndex((event) => event.id === now);
    const indexNext = timedEvents.findIndex((event) => event.id === next);

    if (indexNext - indexNow !== 1) {
      return true;
    }
    // iterate through timed events and see if there are public events between nowPublic and nextPublic
    const nowPublic = state.publicEventNow?.id;
    const nextPublic = state.publicEventNext?.id;

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

  /**
   * Called when the underlying data has changed,
   * we check if the change affects the runtime
   */
  maybeUpdate(playableEvents: OntimeEvent[], affectedIds?: string[]) {
    const state = runtimeState.getState();
    const hasLoadedElements = state.eventNow !== null || state.eventNext !== null;
    if (!hasLoadedElements) {
      return;
    }

    // we need to reload in a few scenarios:
    // 1. we are not confident that changes do not affect running event (eg. all events where changed)
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
      const eventNow = getEventWithId(state.eventNow.id);
      const onlyChangedNow = affectedIds?.length === 1 && affectedIds.at(0) === eventNow.id;
      if (onlyChangedNow) {
        runtimeState.reload(eventNow);
      } else {
        runtimeState.reloadAll(eventNow, playableEvents);
      }
      return;
    }

    // Maybe the event will become the next
    isNext = this.isNewNext();
    if (isNext) {
      runtimeState.loadNext(playableEvents);
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

    const timedEvents = getPlayableEvents();
    const success = runtimeState.load(event, timedEvents);

    if (success) {
      integrationService.dispatch(TimerLifeCycle.onLoad);
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
    const event = getEventWithId(eventId);
    if (!event) {
      return false;
    }
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
    const event = getEventAtIndex(eventIndex);
    if (!event) {
      return false;
    }
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
    const event = getEventWithCue(cue);
    if (!event) {
      return false;
    }
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
    const event = getEventWithId(eventId);
    if (!event) {
      return false;
    }
    return this.loadEvent(event);
  }

  /**
   * loads event matching given ID
   * @param {number} eventIndex
   * @return {boolean} success - whether an event was loaded
   */
  loadByIndex(eventIndex: number): boolean {
    const event = getEventAtIndex(eventIndex);
    if (!event) {
      return false;
    }
    return this.loadEvent(event);
  }

  /**
   * loads first event matching given cue
   * @param {string} cue
   * @return {boolean} success - whether an event was loaded
   */
  loadByCue(cue: string): boolean {
    const event = getEventWithCue(cue);
    if (!event) {
      return false;
    }
    return this.loadEvent(event);
  }

  /**
   * Loads event before currently selected
   * @return {boolean} success - whether an event was loaded
   */
  loadPrevious(): boolean {
    const state = runtimeState.getState();
    const previousEvent = findPrevious(state.eventNow?.id);
    if (previousEvent) {
      return this.loadEvent(previousEvent);
    }
    return false;
  }

  /**
   * Loads event after currently selected
   * @return {boolean} success
   */
  loadNext(): boolean {
    const state = runtimeState.getState();
    const nextEvent = findNext(state.eventNow?.id);
    if (nextEvent) {
      return this.loadEvent(nextEvent);
    }

    logger.info(LogOrigin.Playback, 'No next event found! Continuing playback');
    return false;
  }

  /**
   * Starts playback on selected event
   */
  start() {
    const state = runtimeState.getState();
    const canStart = validatePlayback(state.timer.playback).start;
    if (!canStart) {
      return false;
    }

    const didStart = this.eventTimer.start();
    logger.info(LogOrigin.Playback, `Play Mode ${state.timer.playback.toUpperCase()}`);
    if (didStart) {
      integrationService.dispatch(TimerLifeCycle.onStart);
    }
  }

  /**
   * Starts playback on next event
   */
  startNext() {
    const hasNext = this.loadNext();
    if (!hasNext) {
      return;
    }

    this.start();
  }

  /**
   * Pauses playback on selected event
   */
  pause() {
    const state = runtimeState.getState();
    const canPause = validatePlayback(state.timer.playback).pause;
    if (!canPause) {
      return;
    }
    this.eventTimer.pause();
    const newState = state.timer.playback;
    logger.info(LogOrigin.Playback, `Play Mode ${newState.toUpperCase()}`);
    integrationService.dispatch(TimerLifeCycle.onPause);
  }

  /**
   * Stops timer and unloads any events
   */
  stop() {
    const state = runtimeState.getState();
    const canStop = validatePlayback(state.timer.playback).stop;
    if (!canStop) {
      return;
    }
    this.eventTimer.stop();
    const newState = state.timer.playback;
    logger.info(LogOrigin.Playback, `Play Mode ${newState.toUpperCase()}`);
    integrationService.dispatch(TimerLifeCycle.onStop);
  }

  /**
   * Reloads current event
   */
  reload() {
    const state = runtimeState.getState();
    if (state.eventNow) {
      runtimeState.reload();
    }
  }

  /**
   * Sets playback to roll
   */
  roll() {
    const beforeState = runtimeState.getState();
    const canRoll = validatePlayback(beforeState.timer.playback).roll;
    if (!canRoll) {
      return;
    }

    const playableEvents = getPlayableEvents();
    if (playableEvents.length === 0) {
      logger.warning(LogOrigin.Server, 'Roll: no events found');
      return;
    }

    this.eventTimer.roll(playableEvents);

    const state = runtimeState.getState();
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
      return;
    }

    if (!selectedEventId) {
      return;
    }

    // the db would have to change for the event not to exist
    // we do not kow the reason for the crash, so we check anyway
    const event = getEventWithId(selectedEventId);
    if (!event) {
      return;
    }

    const timedEvents = getPlayableEvents();
    runtimeState.resume(restorePoint, event, timedEvents);
    logger.info(LogOrigin.Playback, 'Resuming playback');
  }

  /**
   * Adds time to current event
   * @param {number} time - time to add in milliseconds
   */
  addTime(time: number) {
    if (this.eventTimer.addTime(time)) {
      logger.info(LogOrigin.Playback, `${time > 0 ? 'Added' : 'Removed'} ${millisToString(time)}`);
    }
  }
}

export const runtimeService = new RuntimeService();
