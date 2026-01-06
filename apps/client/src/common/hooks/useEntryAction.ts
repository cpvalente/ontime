import { useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  EntryId,
  InsertOptions,
  isOntimeEvent,
  isOntimeGroup,
  MaybeString,
  OntimeEntry,
  OntimeEvent,
  Rundown,
  SupportedEntry,
  TimeField,
  TimeStrategy,
  TransientEventPayload,
} from 'ontime-types';
import { dayInMs, generateId, MILLIS_PER_SECOND, parseUserTime, swapEventData } from 'ontime-utils';

import { moveDown, moveUp, orderEntries } from '../../features/rundown/rundown.utils';
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
} from '../api/rundown';
import { logAxiosError } from '../api/utils';
import { useEditorSettings } from '../stores/editorSettings';

export type EventOptions = Partial<{
  // options of any new entries (event / delay / group)
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

  /**
   * Returns the currently loaded rundown
   */
  const getCurrentRundownData = useCallback(() => {
    return queryClient.getQueryData<Rundown>(RUNDOWN);
  }, [queryClient]);

  /**
   * Looks for an entry with a given ID in the currently loaded rundown
   */
  const getEntryById = useCallback(
    (eventId: EntryId): OntimeEntry | undefined => {
      const cachedRundown = getCurrentRundownData();
      if (!cachedRundown?.entries) {
        return;
      }
      return cachedRundown.entries[eventId];
    },
    [getCurrentRundownData],
  );

  /**
   * Calls mutation to add new entry
   * @private
   */
  const { mutateAsync: addEntryMutation } = useMutation({
    mutationFn: ([rundownId, entry]: Parameters<typeof postAddEntry>) => postAddEntry(rundownId, entry),
    onMutate: () => queryClient.cancelQueries({ queryKey: RUNDOWN }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: RUNDOWN }),
  });

  /**
   * Adds an entry to rundown
   */
  const addEntry = useCallback(
    async (entry: Partial<OntimeEntry>, options?: EventOptions) => {
      const rundownData = getCurrentRundownData();
      const rundownId = rundownData?.id;

      if (!rundownId) {
        throw new Error('Rundown not initialised');
      }

      const newEntry: TransientEventPayload = { ...entry, id: generateId() };

      // ************* CHECK OPTIONS specific to events
      if (isOntimeEvent(newEntry)) {
        if (options?.lastEventId) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know this is a value
          const previousEvent = rundownData.entries[options?.lastEventId];
          if (isOntimeEvent(previousEvent)) {
            newEntry.timeStart = previousEvent.timeEnd;
          }
        }

        // Override event with options from editor settings
        newEntry.linkStart = options?.linkPrevious ?? linkPrevious;

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
        await addEntryMutation([rundownId, newEntry]);
      } catch (error) {
        logAxiosError('Failed adding event', error);
      }
    },
    [
      getCurrentRundownData,
      linkPrevious,
      defaultDuration,
      defaultDangerTime,
      defaultWarnTime,
      defaultTimerType,
      defaultEndAction,
      defaultTimeStrategy,
      addEntryMutation,
    ],
  );

  /**
   * Calls mutation to clone a selection
   * @private
   */
  const { mutateAsync: cloneEntryMutation } = useMutation({
    mutationFn: ([rundownId, entryId, options]: Parameters<typeof postCloneEntry>) =>
      postCloneEntry(rundownId, entryId, options),
    onMutate: () => queryClient.cancelQueries({ queryKey: RUNDOWN }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: RUNDOWN }),
  });

  /**
   * Clone an entry
   */
  const clone = useCallback(
    async (entryId: EntryId, options?: InsertOptions) => {
      try {
        const rundownId = getCurrentRundownData()?.id;
        if (!rundownId) {
          throw new Error('Rundown not initialised');
        }

        await cloneEntryMutation([rundownId, entryId, options]);
      } catch (error) {
        logAxiosError('Error cloning entry', error);
      }
    },
    [cloneEntryMutation, getCurrentRundownData],
  );

  /**
   * Calls mutation to update existing entry
   * @private
   */
  const { mutateAsync: updateEntryMutation } = useMutation({
    mutationFn: ([rundownId, newEvent]: Parameters<typeof putEditEntry>) => putEditEntry(rundownId, newEvent),
    // we optimistically update here
    onMutate: async ([_rundownId, newEvent]) => {
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
      if (context?.previousData) {
        queryClient.setQueryData<Rundown>(RUNDOWN, context?.previousData);
      }
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
    async (entry: Partial<OntimeEntry>) => {
      try {
        const rundownId = getCurrentRundownData()?.id;
        if (!rundownId) {
          throw new Error('Rundown not initialised');
        }

        await updateEntryMutation([rundownId, entry]);
      } catch (error) {
        logAxiosError('Error updating event', error);
      }
    },
    [getCurrentRundownData, updateEntryMutation],
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
      const rundownId = getCurrentRundownData()?.id;
      if (!rundownId) {
        throw new Error('Rundown not initialised');
      }

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
        await updateEntryMutation([rundownId, newEvent]);
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
    [getCurrentRundownData, updateEntryMutation, queryClient],
  );

  /**
   * Calls mutation to edit multiple events
   * @private
   */
  const { mutateAsync: batchUpdateEventsMutation } = useMutation({
    mutationFn: ([rundownId, data]: Parameters<typeof putBatchEditEvents>) => putBatchEditEvents(rundownId, data),
    onMutate: async ([_rundownId, data]) => {
      // cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: RUNDOWN });

      // Snapshot the previous value
      const previousRundown = queryClient.getQueryData<Rundown>(RUNDOWN);

      if (previousRundown) {
        const eventIds = new Set(data.ids);
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
    async (data: Partial<OntimeEvent>, eventIds: EntryId[]) => {
      try {
        const rundownId = getCurrentRundownData()?.id;
        if (!rundownId) {
          throw new Error('Rundown not initialised');
        }

        await batchUpdateEventsMutation([rundownId, { data, ids: eventIds }]);
      } catch (error) {
        logAxiosError('Error updating events', error);
      }
    },
    [batchUpdateEventsMutation, getCurrentRundownData],
  );

  /**
   * Calls mutation to delete an entry
   * @private
   */
  const { mutateAsync: deleteEntryMutation } = useMutation({
    mutationFn: ([rundownId, entryIds]: Parameters<typeof deleteEntries>) => deleteEntries(rundownId, entryIds),
    // we optimistically update here
    onMutate: async ([_rundownId, entryIds]) => {
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
        const rundownId = getCurrentRundownData()?.id;
        if (!rundownId) {
          throw new Error('Rundown not initialised');
        }

        await deleteEntryMutation([rundownId, entryIds]);
      } catch (error) {
        logAxiosError('Error deleting event', error);
      }
    },
    [deleteEntryMutation, getCurrentRundownData],
  );

  /**
   * Calls mutation to delete all events
   * @private
   */
  const { mutateAsync: deleteAllEntriesMutation } = useMutation({
    mutationFn: ([rundownId]: Parameters<typeof requestDeleteAll>) => requestDeleteAll(rundownId),
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
      const rundownId = getCurrentRundownData()?.id;
      if (!rundownId) {
        throw new Error('Rundown not initialised');
      }

      await deleteAllEntriesMutation([rundownId]);
    } catch (error) {
      logAxiosError('Error deleting events', error);
    }
  }, [deleteAllEntriesMutation, getCurrentRundownData]);

  /**
   * Calls mutation to apply a delay
   * @private
   */
  const { mutateAsync: applyDelayMutation } = useMutation({
    mutationFn: ([rundownId, delayId]: Parameters<typeof requestApplyDelay>) => requestApplyDelay(rundownId, delayId),
    onMutate: () => queryClient.cancelQueries({ queryKey: RUNDOWN }),
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
        const rundownId = getCurrentRundownData()?.id;
        if (!rundownId) {
          throw new Error('Rundown not initialised');
        }

        await applyDelayMutation([rundownId, delayEventId]);
      } catch (error) {
        logAxiosError('Error applying delay', error);
      }
    },
    [applyDelayMutation, getCurrentRundownData],
  );

  /**
   * Calls mutation to dissolve a group
   * @private
   */
  const { mutateAsync: ungroupMutation } = useMutation({
    mutationFn: ([rundownId, groupId]: Parameters<typeof requestUngroup>) => requestUngroup(rundownId, groupId),
    onMutate: () => queryClient.cancelQueries({ queryKey: RUNDOWN }),
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
   * Deletes a group and moves its events to the top level
   */
  const ungroup = useCallback(
    async (groupId: EntryId) => {
      try {
        const rundownId = getCurrentRundownData()?.id;
        if (!rundownId) {
          throw new Error('Rundown not initialised');
        }

        await ungroupMutation([rundownId, groupId]);
      } catch (error) {
        logAxiosError('Error dissolving group', error);
      }
    },
    [getCurrentRundownData, ungroupMutation],
  );

  /**
   * Calls mutation to create a group with a selection
   * @private
   */
  const { mutateAsync: groupEntriesMutation } = useMutation({
    mutationFn: ([rundownId, entryIds]: Parameters<typeof requestGroupEntries>) =>
      requestGroupEntries(rundownId, entryIds),
    onMutate: () => queryClient.cancelQueries({ queryKey: RUNDOWN }),
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
   * Create a group with a selection
   */
  const groupEntries = useCallback(
    async (entryIds: EntryId[]) => {
      if (entryIds.length === 0) return;

      try {
        const rundownData = getCurrentRundownData();
        const rundownId = rundownData?.id;
        if (!rundownId) {
          throw new Error('Rundown not initialised');
        }

        if (entryIds.length === 1) {
          await groupEntriesMutation([rundownId, entryIds]);
        } else {
          // the user selection may be out of order
          const orderedIds = orderEntries(entryIds, rundownData.flatOrder);
          await groupEntriesMutation([rundownId, orderedIds]);
        }
      } catch (error) {
        logAxiosError('Error grouping entries', error);
      }
    },
    [getCurrentRundownData, groupEntriesMutation],
  );

  /**
   * Calls mutation to reorder an entry
   * @private
   */
  const { mutateAsync: reorderEntryMutation } = useMutation({
    mutationFn: ([rundownId, data]: Parameters<typeof patchReorderEntry>) => patchReorderEntry(rundownId, data),
    onMutate: () => queryClient.cancelQueries({ queryKey: RUNDOWN }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
  });

  /**
   * Reorders a given entry one step up or down in the timeline
   */
  const move = useCallback(
    async (entryId: EntryId, direction: 'up' | 'down') => {
      try {
        const rundownData = getCurrentRundownData();
        const rundownId = rundownData?.id;
        if (!rundownId) {
          throw new Error('Rundown not initialised');
        }

        const { destinationId, order } =
          direction === 'up'
            ? moveUp(entryId, rundownData.flatOrder, rundownData.entries)
            : moveDown(entryId, rundownData.flatOrder, rundownData.entries);

        if (!destinationId) {
          return; // noop
        }

        const reorderObject: ReorderEntry = {
          entryId,
          destinationId,
          order,
        };
        await reorderEntryMutation([rundownId, reorderObject]);
        // the rundown needs to know whether we moved into a group
        return rundownData.entries[destinationId]?.type === SupportedEntry.Group ? destinationId : undefined;
      } catch (error) {
        logAxiosError('Error re-ordering event', error);
      }
      return undefined;
    },
    [getCurrentRundownData, reorderEntryMutation],
  );
  /**
   * Reorders a given entry
   */
  const reorderEntry = useCallback(
    async (entryId: EntryId, destinationId: EntryId, order: 'before' | 'after' | 'insert') => {
      try {
        const rundownId = getCurrentRundownData()?.id;
        if (!rundownId) {
          throw new Error('Rundown not initialised');
        }

        await reorderEntryMutation([
          rundownId,
          {
            entryId,
            destinationId,
            order,
          },
        ]);
      } catch (error) {
        logAxiosError('Error re-ordering event', error);
        throw error; // rethrow to handle in the component
      }
    },
    [getCurrentRundownData, reorderEntryMutation],
  );

  /**
   * Calls mutation to swap events
   * @private
   */
  const { mutateAsync: swapEventsMutation } = useMutation({
    mutationFn: ([rundownId, from, to]: Parameters<typeof requestEventSwap>) => requestEventSwap(rundownId, from, to),
    // we optimistically update here
    onMutate: async ([_rundownId, from, to]) => {
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
    async (from: EntryId, to: EntryId) => {
      try {
        const rundownId = getCurrentRundownData()?.id;
        if (!rundownId) {
          throw new Error('Rundown not initialised');
        }

        await swapEventsMutation([rundownId, from, to]);
      } catch (error) {
        logAxiosError('Error re-ordering event', error);
      }
    },
    [getCurrentRundownData, swapEventsMutation],
  );

  return useMemo(
    () => ({
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
    }),
    [
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
    ],
  );
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
    if (isOntimeGroup(entry) || !entry.parent) {
      order = order.filter((id) => id !== entry.id);
    } else {
      const parent = entries[entry.parent];
      if (parent && isOntimeGroup(parent)) {
        parent.entries = parent.entries.filter((parentEntry) => parentEntry !== entry.id);
      }
    }

    delete entries[entry.id];
    flatOrder = flatOrder.filter((id) => id !== entry.id);
  }

  return { entries, order, flatOrder };
}
