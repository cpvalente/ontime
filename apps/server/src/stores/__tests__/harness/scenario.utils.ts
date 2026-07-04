import { EntryId, MaybeString, OffsetMode, PlayableEvent, Rundown } from 'ontime-types';
import { vi } from 'vitest';

import { rundownCache } from '../../../api-data/rundown/rundown.dao.js';
import { initRundown } from '../../../api-data/rundown/rundown.service.js';
import { RundownMetadata } from '../../../api-data/rundown/rundown.types.js';
import { timerConfig } from '../../../setup/config.js';
import {
  type RuntimeState,
  type UpdateResult,
  addTime,
  clearState,
  getState,
  load,
  pause,
  roll,
  setOffsetMode,
  start,
  stop,
  update,
  updateAll,
  updateLoaded,
  updateRundownData,
} from '../../runtimeState.js';

/**
 * A compact, review-friendly projection of the runtime state
 * This is the primary characterisation contract: it contains every field
 * whose semantics are consumed by clients (offsets, expected times, playback)
 * plus the private fields that drive those calculations
 */
export function digest() {
  const state = getState();
  return {
    clock: state.clock,
    playback: state.timer.playback,
    phase: state.timer.phase,
    current: state.timer.current,
    duration: state.timer.duration,
    elapsed: state.timer.elapsed,
    addedTime: state.timer.addedTime,
    startedAt: state.timer.startedAt,
    secondaryTimer: state.timer.secondaryTimer,
    expectedFinish: state.timer.expectedFinish,
    absolute: state.offset.absolute,
    relative: state.offset.relative,
    mode: state.offset.mode,
    expectedGroupEnd: state.offset.expectedGroupEnd,
    expectedFlagStart: state.offset.expectedFlagStart,
    expectedRundownEnd: state.offset.expectedRundownEnd,
    plannedStart: state.rundown.plannedStart,
    plannedEnd: state.rundown.plannedEnd,
    actualStart: state.rundown.actualStart,
    actualGroupStart: state.rundown.actualGroupStart,
    currentDay: state.rundown.currentDay,
    selectedEventIndex: state.rundown.selectedEventIndex,
    eventNow: state.eventNow?.id ?? null,
    eventNext: state.eventNext?.id ?? null,
    eventFlag: state.eventFlag?.id ?? null,
    groupNow: state.groupNow?.id ?? null,
    pausedAt: state._timer.pausedAt,
    secondaryTarget: state._timer.secondaryTarget,
    hasFinished: state._timer.hasFinished,
    startDayOffset: state._startDayOffset,
  };
}

export type Scenario = {
  /** the processed rundown, after going through the rundown cache */
  rundown: Rundown;
  metadata: RundownMetadata;
  load: (eventId: EntryId) => boolean;
  start: () => boolean;
  pause: () => boolean;
  stop: () => boolean;
  addTime: (amount: number) => boolean;
  /** calls roll, optionally passing the current offset for roll-continuation */
  roll: (keepOffset?: boolean) => { eventId: MaybeString; didStart: boolean };
  setOffsetMode: (mode: OffsetMode) => void;
  updateRundownData: (data: Parameters<typeof updateRundownData>[0]) => void;
  /**
   * emulates a rundown edit while playback continues: re-processes the
   * rundown through the cache and hot-reloads the loaded events, as the
   * rundown service does on a committed mutation
   */
  hotReload: (newRundown: Rundown) => void;
  /** re-arms the loaded event, resetting timer progress, as used by reload() */
  reloadLoaded: () => string | undefined;
  /**
   * advances fake time and calls update() in chunks, exactly as EventTimer would
   * @param ms total time to advance
   * @param stepMs chunk size, defaults to the production update rate (32ms)
   * @returns the result of every update call, so tests can assert on finish flags
   */
  tick: (ms?: number, stepMs?: number) => UpdateResult[];
  /** jumps the wall clock to an absolute time and runs a single update */
  setTime: (time: string) => UpdateResult;
  digest: () => ReturnType<typeof digest>;
  state: () => Readonly<RuntimeState>;
};

/**
 * Creates a test scenario around the real runtimeState singleton
 * - initialises the rundown through the production rundown service
 * - resets playback state and offset mode between scenarios
 *
 * Requires vi.useFakeTimers() to be active
 */
export async function createScenario(initialRundown: Rundown, startTime: string): Promise<Scenario> {
  vi.setSystemTime(startTime);
  clearState();
  // clearState intentionally preserves offset mode, reset it for test isolation
  setOffsetMode(OffsetMode.Absolute);

  await initRundown(initialRundown, {});
  // flush the debounced rundown processing
  vi.runAllTimers();

  const { rundown, metadata } = rundownCache.get();

  const getPlayableEvent = (eventId: EntryId): PlayableEvent => {
    const event = rundown.entries[eventId];
    if (event === undefined) {
      throw new Error(`Test scenario: event ${eventId} not found in rundown`);
    }
    return event as PlayableEvent;
  };

  return {
    rundown,
    metadata,
    load: (eventId) => load(getPlayableEvent(eventId), rundown, metadata),
    start,
    pause,
    stop,
    addTime,
    roll: (keepOffset) => roll(rundown, metadata, keepOffset ? getState().offset : undefined),
    setOffsetMode,
    updateRundownData,
    hotReload: (newRundown) => {
      rundownCache.init(newRundown, {});
      const { rundown: processedRundown, metadata: processedMetadata } = rundownCache.get();
      updateAll(processedRundown, processedMetadata);
    },
    reloadLoaded: () => updateLoaded(),
    tick: (ms = timerConfig.updateRate, stepMs = timerConfig.updateRate) => {
      const results: UpdateResult[] = [];
      let remaining = ms;
      while (remaining > 0) {
        const step = Math.min(stepMs, remaining);
        vi.advanceTimersByTime(step);
        results.push(update());
        remaining -= step;
      }
      return results;
    },
    setTime: (time) => {
      vi.setSystemTime(time);
      return update();
    },
    digest,
    state: getState,
  };
}

/**
 * Utility to assert on the update results collected during a tick
 */
export function countFinishes(results: UpdateResult[]) {
  return {
    timerFinished: results.filter((result) => result.hasTimerFinished).length,
    secondaryFinished: results.filter((result) => result.hasSecondaryTimerFinished).length,
  };
}
