import { type MaybeNumber, RefetchKey } from 'ontime-types';

import { sendRefetch } from '../../adapters/WebsocketAdapter.js';

/**
 * A change to stored data, described by the refetch it requires
 * A rundown change without a rundownId affects every rundown
 */
export type Change = { target: RefetchKey; revision: MaybeNumber; rundownId?: string };
type ChangeListener = (change: Change) => void;

/** consumers which must stay in step with the data, called in the same call as the write */
const listeners = new Set<ChangeListener>();

/** changes waiting to be sent, keyed by what they invalidate */
const pending = new Map<string, Change>();

/**
 * Records that stored data has changed, every write calls this once committed
 * - listeners are called immediately, so they never run on stale data
 * - clients are told to refetch at the end of the event loop, after the caller has replied,
 *   so that changes made in the same cycle reach them once
 */
export function notifyChange(target: RefetchKey, revision: MaybeNumber = null, rundownId?: string) {
  const change = { target, revision, rundownId };
  for (const listener of listeners) {
    listener(change);
  }

  if (pending.size === 0) {
    setImmediate(flush);
  }

  const key = `${target}:${rundownId ?? ''}`;
  const queued = pending.get(key);
  pending.set(key, { ...change, revision: mergeRevisions(queued?.revision, revision) });
}

/**
 * Calls the listener with every change, in the same call as the write
 * @returns a function which removes the listener
 */
export function onChange(listener: ChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function flush() {
  const changes = [...pending.values()];
  pending.clear();

  // a full refetch supersedes every other change
  if (changes.some((change) => change.target === RefetchKey.All)) {
    sendRefetch(RefetchKey.All);
    return;
  }

  for (const { target, revision, rundownId } of changes) {
    sendRefetch(target, revision, rundownId);
  }
}

/**
 * Keeps the latest revision of a change queued more than once
 * A change without a revision forces the refetch, so it wins
 */
function mergeRevisions(queued: MaybeNumber | undefined, revision: MaybeNumber): MaybeNumber {
  if (queued === undefined) return revision;
  if (queued === null || revision === null) return null;
  return Math.max(queued, revision);
}
