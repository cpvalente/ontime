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
  return sharedScript;
}

/** A script built with a view's own settings, at the revision of the shared one */
export function buildScriptWith(settings: TeleprompterSettings): TeleprompterScript {
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
 * Rebuilds the script after the rundown or the settings changed, and keeps the reader in their place in the text
 * Screens are told to refetch it, the script itself is never pushed over the websocket
 */
export function refreshTeleprompterScript() {
  const settings = getSharedSettings();
  const previousEvents = sharedScript.events;
  sharedScript = {
    revision: sharedScript.revision + 1,
    charsPerLine: settings.charsPerLine,
    events: buildScriptEvents(getCurrentRundown(), getProjectCustomFields(), settings),
  };
  layout = makeTeleprompterLayout(sharedScript.events);
  const previousMode = mode;
  mode = { cued: settings.followLoaded };

  publish(reanchorTransport(state, previousEvents, sharedScript.events, now(), mode, previousMode));
  sendRefetch(RefetchKey.Teleprompter, sharedScript.revision);
}

/**
 * Applies a command from the integration API
 * @throws if the command names an event which is not in the script
 */
export function handleTeleprompterCommand(request: TeleprompterRequest): TeleprompterState {
  const command = (() => {
    if (request.type === 'loaded') return { type: 'goto' as const, eventId: findLoadedEvent() };
    if (request.type === 'goto') return { type: 'goto' as const, eventId: findEvent(request.target) };
    return request;
  })();

  return publish(applyTransportCommand(state, command, layout, now(), mode));
}

/** Cued, loading an event moves the reader to its start, and playback carries on from there */
export function followLoadedEvent(eventId: EntryId | null) {
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
    publish(settle(state, layout, now(), mode));
  }, delay);
  // a running prompter does not keep the process alive
  changeTimer.unref();
}
