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
import { dayInMs, generateId, MILLIS_PER_SECOND, parseUserTime, reorderArray, swapEventData } from 'ontime-utils';

import { RUNDOWN } from '../api/constants';
import {
  deleteEntries,
  patchReorderEntry,
  postAddEntry,
  putBatchEditEvents,
  putEditEntry,
  ReorderEntry,
  requestApplyDelay,
  requestDeleteAll,
  requestEventSwap,
  SwapEntry,
} from '../api/rundown';
import { logAxiosError } from '../api/utils';
import { useEditorSettings } from '../stores/editorSettings';

export type EventOptions = Partial<{
  // options to any new block (event / delay / block)
  after: MaybeString;
  before: MaybeString;
  // options to blocks of type OntimeEvent
  defaultPublic: boolean;
  linkPrevious: boolean;
  lastEventId: MaybeString;
}>;

/**
 * Gather utilities for actions on entries
 */
export const useEntryActions = () => {
  const queryClient = useQueryClient();
  const {
    defaultPublic,
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
  const _addEntryMutation = useMutation({
    // TODO(v4): optimistic create entry
    mutationFn: postAddEntry,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
    networkMode: 'always',
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
          defaultPublic: options?.defaultPublic ?? defaultPublic,
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
        newEntry.isPublic = applicationOptions.defaultPublic;

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
        await _addEntryMutation.mutateAsync(newEntry);
      } catch (error) {
        logAxiosError('Failed adding event', error);
      }
    },
    [
      _addEntryMutation,
      defaultDangerTime,
      defaultDuration,
      defaultEndAction,
      defaultPublic,
      defaultTimerType,
      defaultTimeStrategy,
      defaultWarnTime,
      linkPrevious,
      queryClient,
    ],
  );

  /**
   * Calls mutation to update existing entry
   * @private
   */
  const _updateEntryMutation = useMutation({
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
    networkMode: 'always',
  });

  /**
   * Updates existing entry
   */
  const updateEntry = useCallback(
    async (event: Partial<OntimeEntry>) => {
      try {
        await _updateEntryMutation.mutateAsync(event);
      } catch (error) {
        logAxiosError('Error updating event', error);
      }
    },
    [_updateEntryMutation],
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
        await _updateEntryMutation.mutateAsync(newEvent);
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
    [_updateEntryMutation, queryClient],
  );

  /**
   * Calls mutation to edit multiple events
   * @private
   */
  const _batchUpdateEventsMutation = useMutation({
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
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
    onError: (_error, _newEvent, context) => {
      queryClient.setQueryData<Rundown>(RUNDOWN, context?.previousRundown);
    },
    networkMode: 'always',
  });

  const batchUpdateEvents = useCallback(
    async (data: Partial<OntimeEvent>, eventIds: string[]) => {
      try {
        await _batchUpdateEventsMutation.mutateAsync({ ids: eventIds, data });
      } catch (error) {
        logAxiosError('Error updating events', error);
      }
    },
    [_batchUpdateEventsMutation],
  );

  /**
   * Calls mutation to delete an entry
   * @private
   */
  const _deleteEntryMutation = useMutation({
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
    networkMode: 'always',
  });

  /**
   * Deletes an event entry from the rundown
   */
  const deleteEntry = useCallback(
    async (entryIds: EntryId[]) => {
      try {
        await _deleteEntryMutation.mutateAsync(entryIds);
      } catch (error) {
        logAxiosError('Error deleting event', error);
      }
    },
    [_deleteEntryMutation],
  );

  /**
   * Calls mutation to delete all events
   * @private
   */
  const _deleteAllEntriesMutation = useMutation({
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
    networkMode: 'always',
  });

  /**
   * Deletes all entries in the rundown
   */
  const deleteAllEntries = useCallback(async () => {
    try {
      await _deleteAllEntriesMutation.mutateAsync();
    } catch (error) {
      logAxiosError('Error deleting events', error);
    }
  }, [_deleteAllEntriesMutation]);

  /**
   * Calls mutation to apply a delay
   * @private
   */
  const _applyDelayMutation = useMutation({
    mutationFn: requestApplyDelay,
    // Mutation finished, failed or successful
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
    networkMode: 'always',
  });

  /**
   * Applies a given delay
   */
  const applyDelay = useCallback(
    async (delayEventId: string) => {
      try {
        await _applyDelayMutation.mutateAsync(delayEventId);
      } catch (error) {
        logAxiosError('Error applying delay', error);
      }
    },
    [_applyDelayMutation],
  );

  /**
   * Calls mutation to reorder an entry
   * @private
   */
  const _reorderEntryMutation = useMutation({
    mutationFn: patchReorderEntry,
    // we optimistically update here
    onMutate: async (data) => {
      // cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: RUNDOWN });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<Rundown>(RUNDOWN);

      if (previousData) {
        // optimistically update object
        const newOrder = reorderArray(previousData.order, data.from, data.to);
        queryClient.setQueryData<Rundown>(RUNDOWN, {
          id: previousData.id,
          title: previousData.title,
          order: newOrder,
          flatOrder: previousData.flatOrder,
          entries: previousData.entries,
          revision: -1,
        });
      }

      // Return a context with the previous and new events
      return { previousData };
    },

    // Mutation fails, rollback undoes optimist update
    onError: (_error, _data, context) => {
      queryClient.setQueryData<Rundown>(RUNDOWN, context?.previousData);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
    networkMode: 'always',
  });

  /**
   * Reorders a given entry
   */
  const reorderEntry = useCallback(
    async (entryId: string, from: number, to: number) => {
      try {
        const reorderObject: ReorderEntry = {
          eventId: entryId,
          from,
          to,
        };
        await _reorderEntryMutation.mutateAsync(reorderObject);
      } catch (error) {
        logAxiosError('Error re-ordering event', error);
      }
    },
    [_reorderEntryMutation],
  );

  /**
   * Calls mutation to swap events
   * @private
   */
  const _swapEvents = useMutation({
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
    networkMode: 'always',
  });

  /**
   * Swaps the schedule of two events
   */
  const swapEvents = useCallback(
    async ({ from, to }: SwapEntry) => {
      try {
        await _swapEvents.mutateAsync({ from, to });
      } catch (error) {
        logAxiosError('Error re-ordering event', error);
      }
    },
    [_swapEvents],
  );

  return {
    addEntry,
    applyDelay,
    batchUpdateEvents,
    deleteEntry,
    deleteAllEntries,
    getEntryById,
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
      parent.events = parent.events.filter((event) => event !== entry.id);
      parent.numEvents -= 1;
    }

    delete entries[entry.id];
    flatOrder = flatOrder.filter((id) => id !== entry.id);
  }

  return { entries, order, flatOrder };
}
