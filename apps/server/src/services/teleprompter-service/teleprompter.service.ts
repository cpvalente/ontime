import { deepEqual } from 'fast-equals';
import {
  type EntryId,
  defaultTeleprompterSpeed,
  LogOrigin,
  RefetchKey,
  runtimeStorePlaceholder,
  type TeleprompterScript,
  type TeleprompterSettings,
  type TeleprompterState,
  type TeleprompterSync,
  type TeleprompterTransport,
} from 'ontime-types';
import {
  applyTransportCommand,
  describeSync,
  describeTransport,
  getErrorMessage,
  makeTeleprompterLayout,
  reanchorTransport,
  settle,
  type TeleprompterCommand,
  type TeleprompterLayout,
} from 'ontime-utils';

import { sendRefetch } from '../../adapters/WebsocketAdapter.js';
import { getCurrentRundown, getProjectCustomFields } from '../../api-data/rundown/rundown.dao.js';
import { parseTeleprompterSettings } from '../../api-data/teleprompter/teleprompter.parser.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { logger } from '../../classes/Logger.js';
import * as timeCore from '../../lib/time-core/timeCore.js';
import { eventStore } from '../../stores/EventStore.js';
import { getState as getRuntimeState } from '../../stores/runtimeState.js';
import { buildScriptEvents } from './teleprompter.utils.js';

type TeleprompterGotoTarget = Extract<TeleprompterCommand, { type: 'goto' }>['target'];

let sharedScript: TeleprompterScript = { revision: 0, charsPerLine: 0, events: [] };
let layout: TeleprompterLayout = makeTeleprompterLayout([]);
/** The script waits to be built until something reads it, so a project nobody prompts from never builds it */
let isStale = true;
let hasBuilt = false;

/**
 * The transport every controller and the screens following it share
 * It lasts until the server restarts: remote screens cannot be forced to reset, so loading a project does not reset it
 */
let transport: TeleprompterTransport = {
  playback: 'pause',
  mode: 'event',
  speed: defaultTeleprompterSpeed,
  anchor: null,
  at: 0,
  ended: null,
};
/** The reading position screens following the transport animate from, in rows of the shared script */
let sync: TeleprompterSync = { ...runtimeStorePlaceholder.teleprompterSync };

/** The transport is timed on the server clock, which every Ontime client receives as its time of day */
function now(): number {
  return timeCore.timeOfDayNow();
}

function getSharedSettings(): TeleprompterSettings {
  return getDataProvider().getTeleprompterSettings();
}

/** The script every teleprompter view shows, built from the project's settings */
export function getSharedScript(): TeleprompterScript {
  ensureScript();
  return sharedScript;
}

/** The teleprompter as it reads now, for the runtime store to start from */
export function getTeleprompterState(): TeleprompterState {
  return describeTransport(transport, layout, now());
}

export function getTeleprompterSync(): TeleprompterSync {
  return sync;
}

/**
 * Marks the script out of date after the rundown or the settings changed, to rebuild when something next reads it
 * Screens refetch the script on the rundown and teleprompter refetches, which rebuilds it.
 * Call it before sending those, so the refetch finds the script stale
 */
export function invalidateTeleprompterScript() {
  isStale = true;
}

/**
 * Rebuilds an out of date script, and keeps the reader in their place in the text
 * Only a script whose lines changed gets a new revision, so an edit to anything else leaves the response,
 * and its ETag, as it was
 */
function ensureScript() {
  if (!isStale) return;
  // a build which fails keeps the last script until the next change, so the runtime, the commands and the screens
  // carry on with it, and the failure is logged once
  isStale = false;

  try {
    rebuildScript();
  } catch (error) {
    logger.error(LogOrigin.Server, `Teleprompter: could not build the script: ${getErrorMessage(error)}`);
    return;
  }

  // events loaded before anything read the script were not followed
  if (!hasBuilt) {
    hasBuilt = true;
    followLoadedEvent(getRuntimeState().eventNow?.id ?? null);
  }
}

function rebuildScript() {
  const settings = getSharedSettings();
  const events = buildScriptEvents(getCurrentRundown(), getProjectCustomFields(), settings);
  if (settings.charsPerLine === sharedScript.charsPerLine && deepEqual(events, sharedScript.events)) return;

  // everything is worked out before anything changes, so a failure leaves the previous script whole
  const nextLayout = makeTeleprompterLayout(events);
  const nextTransport = reanchorTransport(transport, sharedScript.events, events, now());
  sharedScript = { revision: sharedScript.revision + 1, charsPerLine: settings.charsPerLine, events };
  layout = nextLayout;
  publish(nextTransport);
}

/**
 * Stores the project's teleprompter settings, from the settings endpoint or a project patch
 * Values which are missing or invalid keep the current ones. Screens refetch the script cut with them
 */
export async function applyTeleprompterSettings(input: unknown): Promise<TeleprompterSettings> {
  const settings = parseTeleprompterSettings(input, getSharedSettings());
  await getDataProvider().setTeleprompterSettings(settings);

  setImmediate(() => {
    invalidateTeleprompterScript();
    sendRefetch(RefetchKey.Teleprompter);
  });
  return settings;
}

/**
 * Applies a command from the integration API
 * @returns the teleprompter after the command
 * @throws if the command names an event which is not in the script
 */
export function handleTeleprompterCommand(request: TeleprompterCommand): TeleprompterState {
  ensureScript();
  const command = request.type === 'goto' ? { type: 'goto' as const, eventId: findEvent(request.target) } : request;
  return publish(applyTransportCommand(transport, command, layout, now()));
}

type Batch = ReturnType<typeof eventStore.createBatch>;

/**
 * Reads on with the clock while playback runs, so the line and the time left arrive in the clock's frame
 * Playback which reached its end stops on the tick, which publishes the transport too:
 * screens stop on the exact line on their own, what is published says so up to a second later
 * Paused, nothing moves and nothing is added
 */
export function onClockTick(batch: Batch) {
  if (transport.playback !== 'play') return;
  ensureScript();
  addToBatch(batch, settle(transport, layout, now()));
}

/**
 * Event by event, loading an event moves the reader to its start, and playback carries on from there
 * Before anything has read the script there is no reader to move, the first build follows the loaded event
 */
export function followLoadedEvent(eventId: EntryId | null) {
  if (!hasBuilt) return;
  ensureScript();
  if (transport.mode !== 'event' || !eventId || !layout.events.some((event) => event.id === eventId)) return;
  publish(applyTransportCommand(transport, { type: 'goto', eventId }, layout, now()));
}

/**
 * Finds an event the way the script holds it: skipped events and events without text are not in it
 * An event which is not in the script is passed on by id, for the transport to refuse
 */
function findEvent(target: TeleprompterGotoTarget): EntryId {
  const eventId = (() => {
    if (target === 'loaded') return getRuntimeState().eventNow?.id;
    if ('id' in target) return target.id;
    if ('cue' in target) return sharedScript.events.find((event) => event.cue === target.cue)?.id;
    return sharedScript.events[target.index - 1]?.id;
  })();

  if (!eventId) throw new Error('Event not found');
  return eventId;
}

/** Publishes the transport and what it shows, together */
function publish(next: TeleprompterTransport): TeleprompterState {
  const batch = eventStore.createBatch();
  const state = addToBatch(batch, next);
  batch.send();
  return state;
}

/**
 * Adds the transport and what it shows to a batch
 * Screens animate from the sync key, a position in rows of the shared script, which only changes with the transport
 * or the script, so a screen which connects or reconnects lands where the others are
 */
function addToBatch(batch: Batch, next: TeleprompterTransport): TeleprompterState {
  if (next !== transport || sync.revision !== sharedScript.revision) {
    transport = next;
    sync = describeSync(transport, layout, sharedScript.revision);
    batch.add('teleprompterSync', sync);
  }
  const state = describeTransport(transport, layout, now());
  batch.add('teleprompter', state);
  return state;
}
