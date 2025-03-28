import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  isOntimeEvent,
  MaybeString,
  OntimeBlock,
  OntimeDelay,
  OntimeEntry,
  OntimeEvent,
  Rundown,
  TimeField,
  TimeStrategy,
  TransientEventPayload,
} from 'ontime-types';
import { dayInMs, MILLIS_PER_SECOND, parseUserTime, reorderArray, swapEventData } from 'ontime-utils';

import { RUNDOWN } from '../api/constants';
import {
  ReorderEntry,
  requestApplyDelay,
  requestBatchPutEvents,
  requestDelete,
  requestDeleteAll,
  requestEventSwap,
  requestPostEvent,
  requestPutEvent,
  requestReorderEvent,
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
 * @description Set of utilities for events //TODO: should this be called useEntryAction and so on
 */
export const useEventAction = () => {
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

  const getEventById = useCallback(
    (eventId: string) => {
      const cachedRundown = queryClient.getQueryData<Rundown>(RUNDOWN);
      if (!cachedRundown?.entries) {
        return;
      }
      return cachedRundown.entries[eventId];
    },
    [queryClient],
  );

  /**
   * Calls mutation to add new event
   * @private
   */
  const _addEventMutation = useMutation({
    mutationFn: requestPostEvent,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
    networkMode: 'always',
  });

  /**
   * Adds an event to rundown
   */
  const addEvent = useCallback(
    async (event: Partial<OntimeEvent | OntimeDelay | OntimeBlock>, options?: EventOptions) => {
      const newEvent: TransientEventPayload = { ...event };

      // ************* CHECK OPTIONS specific to events
      if (isOntimeEvent(newEvent)) {
        // merge creation time options with event settings
        const applicationOptions = {
          after: options?.after,
          before: options?.before,
          defaultPublic: options?.defaultPublic ?? defaultPublic,
          lastEventId: options?.lastEventId,
          linkPrevious: options?.linkPrevious ?? linkPrevious,
        };

        if (applicationOptions.linkPrevious && applicationOptions?.lastEventId) {
          newEvent.linkStart = applicationOptions.lastEventId;
        } else if (applicationOptions?.lastEventId) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know this is a value
          const rundownData = queryClient.getQueryData<Rundown>(RUNDOWN)!;
          const previousEvent = rundownData.entries[applicationOptions.lastEventId];
          if (isOntimeEvent(previousEvent)) {
            newEvent.timeStart = previousEvent.timeEnd;
          }
        }

        // Override event with options from editor settings
        if (applicationOptions.defaultPublic) {
          newEvent.isPublic = true;
        }

        if (newEvent.duration === undefined && newEvent.timeEnd === undefined) {
          newEvent.duration = parseUserTime(defaultDuration);
        }

        if (newEvent.timeDanger === undefined) {
          newEvent.timeDanger = parseUserTime(defaultDangerTime);
        }

        if (newEvent.timeWarning === undefined) {
          newEvent.timeWarning = parseUserTime(defaultWarnTime);
        }

        if (newEvent.timerType === undefined) {
          newEvent.timerType = defaultTimerType;
        }

        if (newEvent.endAction === undefined) {
          newEvent.endAction = defaultEndAction;
        }

        if (newEvent.timeStrategy === undefined) {
          newEvent.timeStrategy = defaultTimeStrategy;
        }
      }

      // handle adding options that concern all event type
      if (options?.after) {
        // @ts-expect-error -- not sure how to type this, <after> is a transient property
        newEvent.after = options.after;
      }
      if (options?.before) {
        // @ts-expect-error -- not sure how to type this, <before> is a transient property
        newEvent.before = options.before;
      }

      try {
        await _addEventMutation.mutateAsync(newEvent as TransientEventPayload);
      } catch (error) {
        logAxiosError('Failed adding event', error);
      }
    },
    [
      _addEventMutation,
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
   * Calls mutation to update existing event
   * @private
   */
  const _updateEventMutation = useMutation({
    mutationFn: requestPutEvent,
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
   * Updates existing event
   */
  const updateEvent = useCallback(
    async (event: Partial<OntimeEntry>) => {
      try {
        await _updateEventMutation.mutateAsync(event);
      } catch (error) {
        logAxiosError('Error updating event', error);
      }
    },
    [_updateEventMutation],
  );

  const updateCustomField = useCallback(
    async (eventId: string, field: string, value: string) => {
      updateEvent({ id: eventId, custom: { [field]: value } });
    },
    [updateEvent],
  );

  /**
   * Updates time of existing event
   * @param eventId {string} - id of the event
   * @param field {TimeField} - field to update
   * @param value {string} - new value string to be parsed
   * @param lockOnUpdate {boolean} - whether we will apply the lock / release on update
   */
  const updateTimer = useCallback(
    async (eventId: string, field: TimeField, value: string, lockOnUpdate?: boolean) => {
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
          newEvent.linkStart = value === '' ? 'true' : null;
          newEvent.timeStart = value === '' ? undefined : calculateNewValue();
        }
      } else {
        newEvent[field] = calculateNewValue();
      }

      try {
        await _updateEventMutation.mutateAsync(newEvent);
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
    [_updateEventMutation, queryClient],
  );

  /**
   * Calls mutation to edit multiple events
   * @private
   */
  const _batchUpdateEventsMutation = useMutation({
    mutationFn: requestBatchPutEvents,
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
   * Calls mutation to delete an event
   * @private
   */
  const _deleteEventMutation = useMutation({
    mutationFn: requestDelete,
    // we optimistically update here
    onMutate: async (eventIds: string[]) => {
      // cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: RUNDOWN });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<Rundown>(RUNDOWN);

      if (previousData) {
        // optimistically update object
        const newOrder = previousData.order.filter((id) => !eventIds.includes(id));
        const newRundown = { ...previousData.entries };
        for (const eventId of eventIds) {
          delete newRundown[eventId];
        }

        queryClient.setQueryData<Rundown>(RUNDOWN, {
          id: previousData.id,
          title: previousData.title,
          order: newOrder,
          entries: newRundown,
          revision: -1,
        });
      }

      // Return a context with the previous and new events
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
   * Deletes an event form the list
   */
  const deleteEvent = useCallback(
    async (eventIds: string[]) => {
      try {
        await _deleteEventMutation.mutateAsync(eventIds);
      } catch (error) {
        logAxiosError('Error deleting event', error);
      }
    },
    [_deleteEventMutation],
  );

  /**
   * Calls mutation to delete all events
   * @private
   */
  const _deleteAllEventsMutation = useMutation({
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
        entries: {},
        order: [],
        revision: -1,
      });

      // Return a context with the previous and new events
      return { previousData };
    },

    // Mutation fails, rollback undos optimist update
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
   * Deletes all events from list
   */
  const deleteAllEvents = useCallback(async () => {
    try {
      await _deleteAllEventsMutation.mutateAsync();
    } catch (error) {
      logAxiosError('Error deleting events', error);
    }
  }, [_deleteAllEventsMutation]);

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
   * Applies a given delay block
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
   * Calls mutation to reorder an event
   * @private
   */
  const _reorderEventMutation = useMutation({
    mutationFn: requestReorderEvent,
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
          entries: previousData.entries,
          revision: -1,
        });
      }

      // Return a context with the previous and new events
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
   * Reorders a given event
   */
  const reorderEvent = useCallback(
    async (eventId: string, from: number, to: number) => {
      try {
        const reorderObject: ReorderEntry = {
          eventId,
          from,
          to,
        };
        await _reorderEventMutation.mutateAsync(reorderObject);
      } catch (error) {
        logAxiosError('Error re-ordering event', error);
      }
    },
    [_reorderEventMutation],
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
    addEvent,
    applyDelay,
    batchUpdateEvents,
    deleteEvent,
    deleteAllEvents,
    getEventById,
    reorderEvent,
    swapEvents,
    updateEvent,
    updateTimer,
    updateCustomField,
  };
};
