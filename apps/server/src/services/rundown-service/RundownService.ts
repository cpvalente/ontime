import { CustomFields, Rundown } from 'ontime-types';

import { RefetchTargets, sendRefetch } from '../../adapters/websocketAux.js';
import { updateRundownData } from '../../stores/runtimeState.js';
import { runtimeService } from '../runtime-service/RuntimeService.js';

import * as cache from './rundownCache.js';

/**
 * Forces update in the store
 * Called when we make changes to the rundown object
 */
function updateRuntimeOnChange() {
  const { timedEventsOrder } = cache.getEventOrder();
  const numEvents = timedEventsOrder.length;
  const metadata = cache.getMetadata();

  // schedule an update for the end of the event loop
  setImmediate(() =>
    updateRundownData({
      numEvents,
      ...metadata,
    }),
  );
}

type NotifyChangesOptions = {
  timer?: boolean | string[]; // whether to notify the timer, could be a yes / no or an array of affected IDs
  external?: boolean; // whether to notify external services
  reload?: boolean; // major change, clients should consider refetching everything
};

/**
 * Notify services of changes in the rundown
 */
function notifyChanges(options: NotifyChangesOptions) {
  if (options.timer) {
    const { playableEventsOrder } = cache.getEventOrder();

    if (playableEventsOrder.length === 0) {
      runtimeService.stop();
    } else {
      // notify timer service of changed events
      // timer can be true or an array of changed IDs
      const affected = Array.isArray(options.timer) ? options.timer : undefined;
      runtimeService.notifyOfChangedEvents(affected);
    }
  }

  if (options.external) {
    // advice socket subscribers of change
    const payload = {
      target: RefetchTargets.Rundown,
      changes: Array.isArray(options.timer) ? options.timer : undefined,
      reload: options.reload,
      revision: cache.getMetadata().revision,
    };
    sendRefetch(payload);
  }
}

/**
 * Sets a new rundown in the cache
 * and marks it as the currently loaded one
 */
export async function initRundown(rundown: Readonly<Rundown>, customFields: Readonly<CustomFields>) {
  await cache.init(rundown, customFields);

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer of change
  notifyChanges({ timer: true, external: true, reload: true });
}
