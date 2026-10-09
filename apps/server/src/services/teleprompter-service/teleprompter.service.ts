import { deepEqual } from 'fast-equals';
import {
  type EntryId,
  RefetchKey,
  runtimeStorePlaceholder,
  type TeleprompterScript,
  type TeleprompterSettings,
  type TeleprompterState,
} from 'ontime-types';
import {
  applyTransportCommand,
  makeTeleprompterLayout,
  msUntilChange,
  reanchorTransport,
  settle,
  type TeleprompterLayout,
  type TeleprompterMode,
} from 'ontime-utils';

import { sendRefetch } from '../../adapters/WebsocketAdapter.js';
import { getCurrentRundown, getProjectCustomFields, getRundownMetadata } from '../../api-data/rundown/rundown.dao.js';
import type { TeleprompterRequest } from '../../api-integration/integration.teleprompter.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import * as timeCore from '../../lib/time-core/timeCore.js';
import { eventStore } from '../../stores/EventStore.js';
import { getState as getRuntimeState } from '../../stores/runtimeState.js';
import { buildScriptEvents } from './teleprompter.utils.js';

let sharedScript: TeleprompterScript = { revision: 0, charsPerLine: 0, events: [] };
let layout: TeleprompterLayout = makeTeleprompterLayout([]);
let mode: TeleprompterMode = { cued: true };
/** The script waits to be built until something reads it, so a project nobody prompts from never builds it */
let isStale = true;
let hasBuilt = false;
/** Whether any screen has asked for a script, so edits tell screens to refetch */
let hasReaders = false;

/**
 * The transport every remote screen and controller follows
 * It lasts until the server restarts: remote screens cannot be forced to reset, so loading a project does not reset it
 */
let state: TeleprompterState = { ...runtimeStorePlaceholder.teleprompter };
let changeTimer: NodeJS.Timeout | null = null;

/** The transport is timed on the server clock, which every Ontime client receives as its time of day */
function now(): number {
  return timeCore.timeOfDayNow();
}

function getSharedSettings(): TeleprompterSettings {
  return getDataProvider().getViewSettings().teleprompter;
}

/** The script every remote screen and controller shows, built from the project's settings */
export function getSharedScript(): TeleprompterScript {
  hasReaders = true;
  ensureScript();
  return sharedScript;
}

/** A script built with a view's own settings, at the revision of the shared one */
export function buildScriptWith(settings: TeleprompterSettings): TeleprompterScript {
  hasReaders = true;
  return {
    revision: sharedScript.revision,
    charsPerLine: settings.charsPerLine,
    events: buildScriptEvents(getCurrentRundown(), getProjectCustomFields(), settings),
  };
}

export function getTeleprompterState(): TeleprompterState {
  return state;
}

/**
 * Marks the script out of date after the rundown or the settings changed, to rebuild when something next reads it
 * Screens which have read a script are told to refetch it, which rebuilds it, so a rebuild needs no notice of its own.
 * Local views build with their own settings, so they refetch on every change to the rundown.
 * The script itself is never pushed over the websocket
 */
export function invalidateTeleprompterScript() {
  isStale = true;
  // the next revision is unknown until the script is rebuilt
  if (hasReaders) sendRefetch(RefetchKey.Teleprompter);
}

/**
 * Rebuilds an out of date script, and keeps the reader in their place in the text
 * Only a script whose lines changed gets a new revision, so an edit to anything else leaves the response,
 * and its ETag, as it was
 */
function ensureScript() {
  if (!isStale) return;
  isStale = false;

  const settings = getSharedSettings();
  const events = buildScriptEvents(getCurrentRundown(), getProjectCustomFields(), settings);
  const previousMode = mode;
  mode = { cued: settings.followLoaded };
  const isFirstBuild = !hasBuilt;
  hasBuilt = true;

  if (settings.charsPerLine === sharedScript.charsPerLine && deepEqual(events, sharedScript.events)) {
    if (previousMode.cued !== mode.cued) {
      publish(reanchorTransport(state, sharedScript.events, sharedScript.events, now(), mode, previousMode));
    }
    return;
  }

  const previousEvents = sharedScript.events;
  sharedScript = { revision: sharedScript.revision + 1, charsPerLine: settings.charsPerLine, events };
  layout = makeTeleprompterLayout(events);

  publish(reanchorTransport(state, previousEvents, events, now(), mode, previousMode));

  // events loaded before anything read the script were not followed
  if (isFirstBuild) followLoadedEvent(getRuntimeState().eventNow?.id ?? null);
}

/**
 * Applies a command from the integration API
 * @throws if the command names an event which is not in the script
 */
export function handleTeleprompterCommand(request: TeleprompterRequest): TeleprompterState {
  ensureScript();
  const command = (() => {
    if (request.type === 'loaded') return { type: 'goto' as const, eventId: findLoadedEvent() };
    if (request.type === 'goto') return { type: 'goto' as const, eventId: findEvent(request.target) };
    return request;
  })();

  return publish(applyTransportCommand(state, command, layout, now(), mode));
}

/**
 * Cued, loading an event moves the reader to its start, and playback carries on from there
 * Before anything has read the script there is no reader to move, the first build follows the loaded event
 */
export function followLoadedEvent(eventId: EntryId | null) {
  if (!hasBuilt) return;
  ensureScript();
  if (!mode.cued || !eventId || !layout.events.some((event) => event.id === eventId)) return;
  publish(applyTransportCommand(state, { type: 'goto', eventId }, layout, now(), mode));
}

function findLoadedEvent(): EntryId {
  const loadedId = getRuntimeState().eventNow?.id;
  if (!loadedId) throw new Error('Event not found');
  return loadedId;
}

function findEvent(target: { cue: string } | { id: string } | { index: number }): EntryId {
  const eventId = (() => {
    if ('id' in target) return target.id;
    if ('cue' in target) return sharedScript.events.find((event) => event.cue === target.cue)?.id;
    // indexes count events the way the load action does
    return getRundownMetadata().timedEventOrder[target.index - 1];
  })();

  if (!eventId) throw new Error('Event not found');
  return eventId;
}

function publish(next: TeleprompterState): TeleprompterState {
  if (next !== state) {
    state = next;
    eventStore.set('teleprompter', state);
  }
  scheduleChange();
  return state;
}

/** Wakes up when playback reaches its end or the reader moves into another event, so the state says so */
function scheduleChange() {
  if (changeTimer) clearTimeout(changeTimer);
  changeTimer = null;

  const delay = msUntilChange(state, layout, now(), mode);
  if (delay === null) return;
  changeTimer = setTimeout(() => {
    changeTimer = null;
    ensureScript();
    publish(settle(state, layout, now(), mode));
  }, delay);
  // a running prompter does not keep the process alive
  changeTimer.unref();
}
