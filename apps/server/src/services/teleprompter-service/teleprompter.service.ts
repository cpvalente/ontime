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

import * as logger from '../../api-data/logs/logs.service.js';
import { getCurrentRundown, getCurrentRundownId, getProjectCustomFields } from '../../api-data/rundown/rundown.dao.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import * as timeCore from '../../lib/time-core/timeCore.js';
import { eventStore } from '../../stores/EventStore.js';
import { getState as getRuntimeState } from '../../stores/runtimeState.js';
import { type Change, notifyChange, onChange } from '../change-service/change.service.js';
import { buildScriptEvents, parseTeleprompterSettings } from './teleprompter.utils.js';

type TeleprompterGotoTarget = Extract<TeleprompterCommand, { type: 'goto' }>['target'];

let sharedScript: TeleprompterScript = { revision: 0, charsPerLine: 0, events: [] };
let layout: TeleprompterLayout = makeTeleprompterLayout([]);
/** The script waits to be built until something reads it, so a project nobody prompts from never builds it */
let isStale = true;
/** the project the shared script was built from */
let scriptProjectId: string | null = null;
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

/**
 * The script a view reads: the shared one, or one built from another field for a view which plays on its own
 * Nothing follows a script from another field, so it is built on each read and has no revision to follow
 */
export function getScript(source?: string): TeleprompterScript {
  const settings = getSharedSettings();
  if (!source || source === settings.script) return getSharedScript();

  const events = buildScriptEvents(getCurrentRundown(), getProjectCustomFields(), { ...settings, script: source });
  return { revision: 0, charsPerLine: settings.charsPerLine, events };
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
 * It listens to every committed change, before screens are told to refetch, so the refetch finds the script stale
 */
export function invalidateTeleprompterScript() {
  isStale = true;
}

/** The script is built from the loaded rundown, the custom fields and the teleprompter settings */
function isScriptChange({ target, rundownId }: Change): boolean {
  if (target === RefetchKey.Rundown) return rundownId === undefined || rundownId === getCurrentRundownId();
  return target === RefetchKey.All || target === RefetchKey.CustomFields || target === RefetchKey.Teleprompter;
}

let stopListening: (() => void) | undefined;

/** Follows changes to what the script is built from, until shutdown */
export function initTeleprompter() {
  stopListening = onChange((change) => {
    if (isScriptChange(change)) invalidateTeleprompterScript();
  });
}

export function shutdownTeleprompter() {
  stopListening?.();
  stopListening = undefined;
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
    logger.error(LogOrigin.Server, 'Teleprompter script build failed', { error: getErrorMessage(error) });
    return;
  }

  // events loaded before anything read the script were not followed
  if (!hasBuilt) {
    hasBuilt = true;
    goToLoadedEvent(getRuntimeState().eventNow?.id ?? null);
  }
}

function rebuildScript() {
  const projectId = getDataProvider().getProjectId();
  const settings = getSharedSettings();
  const events = buildScriptEvents(getCurrentRundown(), getProjectCustomFields(), settings);
  // shared playback never carries into another project
  const shouldPause = projectId !== scriptProjectId && transport.playback === 'play';
  const pause = (next: TeleprompterTransport, nextLayout: TeleprompterLayout) =>
    shouldPause ? applyTransportCommand(next, { type: 'pause' }, nextLayout, now()) : next;

  if (settings.charsPerLine === sharedScript.charsPerLine && deepEqual(events, sharedScript.events)) {
    scriptProjectId = projectId;
    if (shouldPause) publish(pause(transport, layout));
    return;
  }

  // everything is worked out before anything changes, so a failure leaves the previous script whole
  const nextLayout = makeTeleprompterLayout(events);
  const nextTransport = pause(
    reanchorTransport(transport, { events: sharedScript.events, layout }, { events, layout: nextLayout }, now()),
    nextLayout,
  );
  scriptProjectId = projectId;
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
  notifyChange(RefetchKey.Teleprompter);
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
 * Once used, a paused transport also rebuilds stale scripts so integration feedback stays current.
 * An unchanged paused transport adds nothing.
 */
export function onClockTick(batch: Batch) {
  if (!hasBuilt) return;
  ensureScript();
  if (transport.playback !== 'play') return;
  addToBatch(batch, settle(transport, layout, now()));
}

/**
 * Event by event, loading an event moves the reader to its start, and playback carries on from there
 * Before anything has read the script there is no reader to move, the first build follows the loaded event
 */
export function followLoadedEvent(eventId: EntryId | null) {
  if (!hasBuilt) return;
  ensureScript();
  goToLoadedEvent(eventId);
}

function goToLoadedEvent(eventId: EntryId | null) {
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
