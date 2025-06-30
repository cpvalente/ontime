import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  EntryId,
  isOntimeBlock,
  isOntimeEvent,
  MaybeString,
  OntimeBlock,
  OntimeEntry,
  OntimeEvent,
  Rundown,
  TimeField,
  TimeStrategy,
  TransientEventPayload,
} from 'ontime-types';
import { dayInMs, generateId, MILLIS_PER_SECOND, parseUserTime, swapEventData } from 'ontime-utils';

import { moveDown, moveUp } from '../../features/rundown/rundown.utils';
import { RUNDOWN } from '../api/constants';
import {
  deleteEntries,
  patchReorderEntry,
  postAddEntry,
  postCloneEntry,
  putBatchEditEvents,
  putEditEntry,
  ReorderEntry,
  requestApplyDelay,
  requestDeleteAll,
  requestEventSwap,
  requestGroupEntries,
  requestUngroup,
  SwapEntry,
} from '../api/rundown';
import { logAxiosError } from '../api/utils';
import { useEditorSettings } from '../stores/editorSettings';

export type EventOptions = Partial<{
  // options of any new entries (event / delay / block)
  after: MaybeString;
  before: MaybeString;
  // options of entries of type OntimeEvent
  linkPrevious: boolean;
  lastEventId: MaybeString;
}>;

/**
 * Gather utilities for actions on entries
 */
export const useEntryActions = () => {
  const queryClient = useQueryClient();
  const {
    linkPrevious,
    defaultTimeStrategy,
    defaultDuration,
    defaultWarnTime,
    defaultDangerTime,
    defaultTimerType,
    defaultEndAction,
  } = useEditorSettings();

  const getEntryById = useCallback(
    (eventId: string): OntimeEntry | undefined => {
      const cachedRundown = queryClient.getQueryData<Rundown>(RUNDOWN);
      if (!cachedRundown?.entries) {
        return;
      }
      return cachedRundown.entries[eventId];
    },
    [queryClient],
  );

  /**
   * Calls mutation to add new entry
   * @private
   */
  const { mutateAsync: addEntryMutation } = useMutation({
    // TODO(v4): optimistic create entry
    mutationFn: postAddEntry,
    onSettled: () => queryClient.invalidateQueries({ queryKey: RUNDOWN }),
  });

  /**
   * Adds an entry to rundown
   */
  const addEntry = useCallback(
    async (entry: Partial<OntimeEntry>, options?: EventOptions) => {
      const newEntry: TransientEventPayload = { ...entry, id: generateId() };

      // ************* CHECK OPTIONS specific to events
      if (isOntimeEvent(newEntry)) {
        // merge creation time options with event settings
        const applicationOptions = {
          after: options?.after,
          before: options?.before,
          lastEventId: options?.lastEventId,
          linkPrevious: options?.linkPrevious ?? linkPrevious,
        };

        if (applicationOptions?.lastEventId) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know this is a value
          const rundownData = queryClient.getQueryData<Rundown>(RUNDOWN)!;
          const previousEvent = rundownData.entries[applicationOptions.lastEventId];
          if (isOntimeEvent(previousEvent)) {
            newEntry.timeStart = previousEvent.timeEnd;
          }
        }

        // Override event with options from editor settings
        newEntry.linkStart = applicationOptions.linkPrevious;

        if (newEntry.duration === undefined && newEntry.timeEnd === undefined) {
          newEntry.duration = parseUserTime(defaultDuration);
        }

        if (newEntry.timeDanger === undefined) {
          newEntry.timeDanger = parseUserTime(defaultDangerTime);
        }

        if (newEntry.timeWarning === undefined) {
          newEntry.timeWarning = parseUserTime(defaultWarnTime);
        }

        if (newEntry.timerType === undefined) {
          newEntry.timerType = defaultTimerType;
        }

        if (newEntry.endAction === undefined) {
          newEntry.endAction = defaultEndAction;
        }

        if (newEntry.timeStrategy === undefined) {
          newEntry.timeStrategy = defaultTimeStrategy;
        }
      }

      // handle adding options that concern all event type
      if (options?.after) {
        (newEntry as TransientEventPayload).after = options.after;
      }
      if (options?.before) {
        (newEntry as TransientEventPayload).before = options.before;
      }

      try {
        await addEntryMutation(newEntry);
      } catch (error) {
        logAxiosError('Failed adding event', error);
      }
    },
    [
      addEntryMutation,
      defaultDangerTime,
      defaultDuration,
      defaultEndAction,
      defaultTimerType,
      defaultTimeStrategy,
      defaultWarnTime,
      linkPrevious,
      queryClient,
    ],
  );

  /**
   * Calls mutation to clone a selection
   * @private
   */
  const { mutateAsync: cloneEntryMutation } = useMutation({
    mutationFn: postCloneEntry,
    onSettled: () => queryClient.invalidateQueries({ queryKey: RUNDOWN }),
  });

  /**
   * Clone a selection
   */
  const clone = useCallback(
    async (entryId: EntryId) => {
      try {
        await cloneEntryMutation(entryId);
      } catch (error) {
        logAxiosError('Error cloning entry', error);
      }
    },
    [cloneEntryMutation],
  );

  /**
   * Calls mutation to update existing entry
   * @private
   */
  const { mutateAsync: updateEntryMutation } = useMutation({
    mutationFn: putEditEntry,
    // we optimistically update here
    onMutate: async (newEvent) => {
      // cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: RUNDOWN });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<Rundown>(RUNDOWN);
      const eventId = newEvent.id;

      if (previousData && eventId) {
        // optimistically update object
        const newRundown = { ...previousData.entries };
        // @ts-expect-error -- we expect the events to be of same type
        newRundown[eventId] = { ...newRundown[eventId], ...newEvent };
        queryClient.setQueryData<Rundown>(RUNDOWN, {
          id: previousData.id,
          title: previousData.title,
          order: previousData.order,
          flatOrder: previousData.flatOrder,
          entries: newRundown,
          revision: -1,
        });
      }

      // Return a context with the previous and new events
      return { previousData, newEvent };
    },
    // Mutation fails, rollback undoes optimist update
    onError: (_error, _newEvent, context) => {
      queryClient.setQueryData<Rundown>(RUNDOWN, context?.previousData);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
  });

  /**
   * Updates existing entry
   */
  const updateEntry = useCallback(
    async (event: Partial<OntimeEntry>) => {
      try {
        await updateEntryMutation(event);
      } catch (error) {
        logAxiosError('Error updating event', error);
      }
    },
    [updateEntryMutation],
  );

  const updateCustomField = useCallback(
    async (entryId: EntryId, field: string, value: string) => {
      updateEntry({ id: entryId, custom: { [field]: value } });
    },
    [updateEntry],
  );

  /**
   * Updates time of existing event
   * @param eventId {EntryId} - id of the event
   * @param field {TimeField} - field to update
   * @param value {string} - new value string to be parsed
   * @param lockOnUpdate {boolean} - whether we will apply the lock / release on update
   */
  const updateTimer = useCallback(
    async (eventId: EntryId, field: TimeField, value: string, lockOnUpdate?: boolean) => {
      // an empty value with no lock has no domain validity
      if (!lockOnUpdate && value === '') {
        return;
      }

      const newEvent: Partial<OntimeEvent> = {
        id: eventId,
      };

      // check if we should lock the field
      if (lockOnUpdate) {
        if (field === 'timeEnd') {
          // an empty value indicates that we should unlock the field
          newEvent.timeStrategy = value === '' ? TimeStrategy.LockDuration : TimeStrategy.LockEnd;
          newEvent.timeEnd = value === '' ? undefined : calculateNewValue();
        } else if (field === 'duration') {
          // an empty value indicates that we should unlock the field
          newEvent.timeStrategy = value === '' ? TimeStrategy.LockEnd : TimeStrategy.LockDuration;
          newEvent.duration = value === '' ? undefined : calculateNewValue();
        } else if (field === 'timeStart') {
          // an empty values means we should link to the previous
          newEvent.linkStart = value === '';
          newEvent.timeStart = value === '' ? undefined : calculateNewValue();
        }
      } else {
        newEvent[field] = calculateNewValue();
      }

      try {
        await updateEntryMutation(newEvent);
      } catch (error) {
        logAxiosError('Error updating event', error);
      }

      /**
       * Utility function to calculate the new time value
       */
      function calculateNewValue(): number {
        let newValMillis = 0;

        // check for previous keyword
        if (value === 'p' || value === 'prev' || value === 'previous') {
          newValMillis = getPreviousEnd();

          // check for adding time keyword
        } else if (value.startsWith('+') || value.startsWith('p+') || value.startsWith('p +')) {
          // TODO: is this logic solid?
          const remainingString = value.substring(1);
          newValMillis = getPreviousEnd() + parseUserTime(remainingString);
        } else {
          newValMillis = parseUserTime(value);
        }
        // dont allow timer values over 23:59:59
        return Math.min(newValMillis, dayInMs - MILLIS_PER_SECOND);
      }

      /**
       * Utility function to get the previous event end time
       */
      function getPreviousEnd(): number {
        const cachedRundown = queryClient.getQueryData<Rundown>(RUNDOWN);

        if (!cachedRundown?.order || !cachedRundown?.entries) {
          return 0;
        }

        const index = cachedRundown.order.indexOf(eventId);
        if (index === 0) {
          return 0;
        }
        let previousEnd = 0;
        for (let i = index - 1; i >= 0; i--) {
          const event = cachedRundown.entries[cachedRundown.order[i]];
          if (isOntimeEvent(event)) {
            previousEnd = event.timeEnd;
            break;
          }
        }
        return previousEnd;
      }
    },
    [updateEntryMutation, queryClient],
  );

  /**
   * Calls mutation to edit multiple events
   * @private
   */
  const { mutateAsync: batchUpdateEventsMutation } = useMutation({
    mutationFn: putBatchEditEvents,
    onMutate: async ({ ids, data }) => {
      // cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: RUNDOWN });

      // Snapshot the previous value
      const previousRundown = queryClient.getQueryData<Rundown>(RUNDOWN);

      if (previousRundown) {
        const eventIds = new Set(ids);
        const newRundown = { ...previousRundown.entries };

        eventIds.forEach((eventId) => {
          if (Object.hasOwn(newRundown, eventId)) {
            const event = newRundown[eventId];
            if (isOntimeEvent(event)) {
              newRundown[eventId] = {
                ...event,
                ...data,
              };
            }
          }
        });

        queryClient.setQueryData<Rundown>(RUNDOWN, {
          id: previousRundown.id,
          title: previousRundown.title,
          order: previousRundown.order,
          flatOrder: previousRundown.flatOrder,
          entries: newRundown,
          revision: -1,
        });
      }

      // Return a context with the previous rundown
      return { previousRundown };
    },
    onSuccess: (response) => {
      if (!response.data) return;

      const { id, title, order, flatOrder, entries, revision } = response.data;
      queryClient.setQueryData<Rundown>(RUNDOWN, {
        id,
        title,
        order,
        flatOrder,
        entries,
        revision,
      });
    },
    onError: (_error, _newEvent, context) => {
      queryClient.setQueryData<Rundown>(RUNDOWN, context?.previousRundown);
    },
  });

  const batchUpdateEvents = useCallback(
    async (data: Partial<OntimeEvent>, eventIds: string[]) => {
      try {
        await batchUpdateEventsMutation({ ids: eventIds, data });
      } catch (error) {
        logAxiosError('Error updating events', error);
      }
    },
    [batchUpdateEventsMutation],
  );

  /**
   * Calls mutation to delete an entry
   * @private
   */
  const { mutateAsync: deleteEntryMutation } = useMutation({
    mutationFn: deleteEntries,
    // we optimistically update here
    onMutate: async (entryIds: EntryId[]) => {
      // cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: RUNDOWN });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<Rundown>(RUNDOWN);

      if (previousData) {
        // optimistically update object
        const { entries, order, flatOrder } = optimisticDeleteEntries(entryIds, previousData);

        queryClient.setQueryData<Rundown>(RUNDOWN, {
          id: previousData.id,
          title: previousData.title,
          order,
          flatOrder,
          entries,
          revision: -1,
        });
      }

      // Return a context with the previous and new events
      return { previousData };
    },

    // Mutation fails, rollback undoes optimist update
    onError: (_error, _entryIds, context) => {
      queryClient.setQueryData<Rundown>(RUNDOWN, context?.previousData);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
  });

  /**
   * Deletes an event entry from the rundown
   */
  const deleteEntry = useCallback(
    async (entryIds: EntryId[]) => {
      try {
        await deleteEntryMutation(entryIds);
      } catch (error) {
        logAxiosError('Error deleting event', error);
      }
    },
    [deleteEntryMutation],
  );

  /**
   * Calls mutation to delete all events
   * @private
   */
  const { mutateAsync: deleteAllEntriesMutation } = useMutation({
    mutationFn: requestDeleteAll,
    // we optimistically update here
    onMutate: async () => {
      // cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: RUNDOWN });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<Rundown>(RUNDOWN);

      // optimistically update object
      queryClient.setQueryData<Rundown>(RUNDOWN, {
        id: previousData?.id ?? 'default',
        title: previousData?.title ?? '',
        order: [],
        flatOrder: [],
        entries: {},
        revision: -1,
      });

      // Return a context with the previous and new events
      return { previousData };
    },

    // Mutation fails, rollback optimist update
    onError: (_error, _, context) => {
      queryClient.setQueryData<Rundown>(RUNDOWN, context?.previousData);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
  });

  /**
   * Deletes all entries in the rundown
   */
  const deleteAllEntries = useCallback(async () => {
    try {
      await deleteAllEntriesMutation();
    } catch (error) {
      logAxiosError('Error deleting events', error);
    }
  }, [deleteAllEntriesMutation]);

  /**
   * Calls mutation to apply a delay
   * @private
   */
  const { mutateAsync: applyDelayMutation } = useMutation({
    mutationFn: requestApplyDelay,
    onSuccess: (response) => {
      if (!response.data) return;

      const { id, title, order, flatOrder, entries, revision } = response.data;
      queryClient.setQueryData<Rundown>(RUNDOWN, {
        id,
        title,
        order,
        flatOrder,
        entries,
        revision,
      });
    },
    // Mutation finished, failed or successful
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
  });

  /**
   * Applies a given delay
   */
  const applyDelay = useCallback(
    async (delayEventId: EntryId) => {
      try {
        await applyDelayMutation(delayEventId);
      } catch (error) {
        logAxiosError('Error applying delay', error);
      }
    },
    [applyDelayMutation],
  );

  /**
   * Calls mutation to dissolve a block
   * @private
   */
  const { mutateAsync: ungroupMutation } = useMutation({
    mutationFn: requestUngroup,
    onSuccess: (response) => {
      if (!response.data) return;

      const { id, title, order, flatOrder, entries, revision } = response.data;
      queryClient.setQueryData<Rundown>(RUNDOWN, {
        id,
        title,
        order,
        flatOrder,
        entries,
        revision,
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: RUNDOWN }),
  });

  /**
   * Deletes a block and moves its events to the top level
   */
  const ungroup = useCallback(
    async (blockId: EntryId) => {
      try {
        await ungroupMutation(blockId);
      } catch (error) {
        logAxiosError('Error dissolving block', error);
      }
    },
    [ungroupMutation],
  );

  /**
   * Calls mutation to create a block with a selection
   * @private
   */
  const { mutateAsync: groupEntriesMutation } = useMutation({
    mutationFn: requestGroupEntries,
    onSuccess: (response) => {
      if (!response.data) return;

      const { id, title, order, flatOrder, entries, revision } = response.data;
      queryClient.setQueryData<Rundown>(RUNDOWN, {
        id,
        title,
        order,
        flatOrder,
        entries,
        revision,
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: RUNDOWN }),
  });

  /**
   * Create a block with a selection
   */
  const groupEntries = useCallback(
    async (entryIds: EntryId[]) => {
      try {
        await groupEntriesMutation(entryIds);
      } catch (error) {
        logAxiosError('Error grouping entries', error);
      }
    },
    [groupEntriesMutation],
  );

  /**
   * Calls mutation to reorder an entry
   * @private
   */
  const { mutateAsync: reorderEntryMutation } = useMutation({
    mutationFn: patchReorderEntry,
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
  });

  /**
   * Reorders a given entry one step up or down in the timeline
   */
  const move = useCallback(
    async (entryId: EntryId, direction: 'up' | 'down') => {
      const rundown = queryClient.getQueryData<Rundown>(RUNDOWN);
      if (!rundown) {
        return;
      }

      const { destinationId, order } =
        direction === 'up'
          ? moveUp(entryId, rundown.flatOrder, rundown.entries)
          : moveDown(entryId, rundown.flatOrder, rundown.entries);

      if (!destinationId) {
        return; // noop
      }

      try {
        const reorderObject: ReorderEntry = {
          entryId,
          destinationId,
          order,
        };
        await reorderEntryMutation(reorderObject);
      } catch (error) {
        logAxiosError('Error re-ordering event', error);
      }
      // the rundown needs to know whether we moved into a block
      return rundown.entries[destinationId]?.type === 'block' ? destinationId : undefined;
    },
    [queryClient, reorderEntryMutation],
  );
  /**
   * Reorders a given entry
   */
  const reorderEntry = useCallback(
    async (entryId: EntryId, destinationId: EntryId, order: 'before' | 'after' | 'insert') => {
      try {
        const reorderObject: ReorderEntry = {
          entryId,
          destinationId,
          order,
        };
        await reorderEntryMutation(reorderObject);
      } catch (error) {
        logAxiosError('Error re-ordering event', error);
      }
    },
    [reorderEntryMutation],
  );

  /**
   * Calls mutation to swap events
   * @private
   */
  const { mutateAsync: swapEventsMutation } = useMutation({
    mutationFn: requestEventSwap,
    // we optimistically update here
    onMutate: async ({ from, to }) => {
      // cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: RUNDOWN });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<Rundown>(RUNDOWN);
      if (previousData) {
        // optimistically update object
        const newRundown = { ...previousData.entries };
        const eventA = previousData.entries[from];
        const eventB = previousData.entries[to];

        if (!isOntimeEvent(eventA) || !isOntimeEvent(eventB)) {
          return;
        }

        const [newA, newB] = swapEventData(eventA, eventB);
        newRundown[from] = newA;
        newRundown[to] = newB;

        queryClient.setQueryData<Rundown>(RUNDOWN, {
          id: previousData.id,
          title: previousData.title,
          order: previousData.order,
          flatOrder: previousData.flatOrder,
          entries: newRundown,
          revision: -1,
        });
      }

      // Return a context with the previous events
      return { previousData };
    },

    // Mutation fails, rollback undoes optimist update
    onError: (_error, _eventId, context) => {
      queryClient.setQueryData<Rundown>(RUNDOWN, context?.previousData);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
  });

  /**
   * Swaps the schedule of two events
   */
  const swapEvents = useCallback(
    async ({ from, to }: SwapEntry) => {
      try {
        await swapEventsMutation({ from, to });
      } catch (error) {
        logAxiosError('Error re-ordering event', error);
      }
    },
    [swapEventsMutation],
  );

  return {
    addEntry,
    applyDelay,
    batchUpdateEvents,
    clone,
    deleteEntry,
    deleteAllEntries,
    ungroup,
    getEntryById,
    groupEntries,
    move,
    reorderEntry,
    swapEvents,
    updateEntry,
    updateTimer,
    updateCustomField,
  };
};

/**
 * Utility to optimistically delete entries from client cache
 */
function optimisticDeleteEntries(entryIds: EntryId[], rundown: Rundown) {
  const entries = { ...rundown.entries };
  let order = [...rundown.order];
  let flatOrder = [...rundown.flatOrder];

  for (let i = 0; i < entryIds.length; i++) {
    const entry = entries[entryIds[i]];
    deleteEntry(entry);
  }

  function deleteEntry(entry: OntimeEntry) {
    if (isOntimeBlock(entry) || !entry.parent) {
      order = order.filter((id) => id !== entry.id);
    } else {
      const parent = entries[entry.parent] as OntimeBlock;
      parent.entries = parent.entries.filter((parentEntry) => parentEntry !== entry.id);
    }

    delete entries[entry.id];
    flatOrder = flatOrder.filter((id) => id !== entry.id);
  }

  return { entries, order, flatOrder };
}
