import { RuntimeStore, SimpleDirection, SimplePlayback } from 'ontime-types';
import { sanitiseAuxTimerNames } from 'ontime-utils';

import * as timeCore from '../../lib/time-core/timeCore.js';
import { timerConfig } from '../../setup/config.js';
import { eventStore } from '../../stores/EventStore.js';
import { restoreService } from '../restore-service/restore.service.js';
import * as auxTimer from './auxTimer.utils.js';
import type { AuxTimer, AuxTimers } from './auxTimer.utils.js';

type AuxTimerStateUpdate = Partial<Pick<RuntimeStore, 'auxtimer1' | 'auxtimer2' | 'auxtimer3'>>;
type EmitFn = (state: AuxTimerStateUpdate) => void;
type GetTimeFn = () => number;
type SaveFn = (timers: AuxTimers) => void;

export function createAuxTimerService(emit: EmitFn, getTime: GetTimeFn, save: SaveFn) {
  let timers: AuxTimers = [
    auxTimer.createAuxTimer(timerConfig.auxTimerDefault),
    auxTimer.createAuxTimer(timerConfig.auxTimerDefault),
    auxTimer.createAuxTimer(timerConfig.auxTimerDefault),
  ];
  let names = ['', '', ''];
  let interval: NodeJS.Timeout | null = null;

  /**
   * The aux timers are runtime singletons which outlive a project,
   * so loading or editing a project does not refresh them: their names have to be pushed in.
   */
  function loadNames(projectNames?: string[]) {
    names = sanitiseAuxTimerNames(projectNames);
    emitAll();
  }

  /**
   * Continues the aux timers from a restore point, names are kept
   */
  function resume(savedTimers: AuxTimers) {
    timers = [...savedTimers];
    emitAll();
    updateInterval();
    save([...timers]);
  }

  function setDirection(direction: SimpleDirection, index: number) {
    return apply(index, (timer, now) => auxTimer.setDirection(timer, direction, now));
  }

  function start(index: number) {
    return apply(index, auxTimer.start);
  }

  function pause(index: number) {
    return apply(index, auxTimer.pause);
  }

  function stop(index: number) {
    return apply(index, auxTimer.stop);
  }

  function setTime(duration: number, index: number) {
    return apply(index, (timer, now) => auxTimer.setTime(timer, duration, now));
  }

  function addTime(millis: number, index: number) {
    return apply(index, (timer) => auxTimer.addTime(timer, millis));
  }

  /**
   * Applies a command to the timer at index (1-3), then broadcasts and saves it
   */
  function apply(index: number, command: (timer: AuxTimer, now: number) => AuxTimer) {
    const now = getTime();
    const slot = index - 1;
    timers[slot] = command(timers[slot], now);
    updateInterval();

    const state = auxTimer.toTimerState(timers[slot], names[slot], now);
    emit({ [`auxtimer${index}`]: state });
    save([...timers]);
    return state;
  }

  function emitAll() {
    const now = getTime();
    emit({
      auxtimer1: auxTimer.toTimerState(timers[0], names[0], now),
      auxtimer2: auxTimer.toTimerState(timers[1], names[1], now),
      auxtimer3: auxTimer.toTimerState(timers[2], names[2], now),
    });
  }

  /**
   * Ticks only while a timer is running
   */
  function updateInterval() {
    const isRunning = timers.some((timer) => timer.playback === SimplePlayback.Start);
    if (isRunning && !interval) {
      interval = setInterval(update, 500);
    } else if (!isRunning) {
      dispose();
    }
  }

  /**
   * Emits the running timers in one patch
   */
  function update() {
    const now = getTime();
    const patch: AuxTimerStateUpdate = {};
    timers.forEach((timer, slot) => {
      if (timer.playback === SimplePlayback.Start) {
        patch[`auxtimer${slot + 1}` as keyof AuxTimerStateUpdate] = auxTimer.toTimerState(timer, names[slot], now);
      }
    });
    emit(patch);
  }

  function dispose() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  return { loadNames, resume, setDirection, start, pause, stop, setTime, addTime, dispose };
}

const emit = (state: AuxTimerStateUpdate) => {
  for (const [key, value] of Object.entries(state)) {
    eventStore.set(key as keyof RuntimeStore, value);
  }
};
// the restore service handles its errors
const save = (timers: AuxTimers) => void restoreService.saveAuxTimers(timers);

export const auxTimerService = createAuxTimerService(emit, timeCore.now, save);
