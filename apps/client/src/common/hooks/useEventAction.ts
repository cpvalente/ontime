import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isOntimeEvent, MaybeString, OntimeEvent, OntimeRundownEntry, RundownCached } from 'ontime-types';
import { getLinkedTimes, getPreviousEventNormal, reorderArray, swapEventData } from 'ontime-utils';

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
import { forgivingStringToMillis } from '../utils/dateConfig';

/**
 * @description Set of utilities for events
 */
export const useEventAction = () => {
  const queryClient = useQueryClient();
  const { defaultPublic, linkPrevious, defaultDuration } = useEditorSettings((state) => state.eventSettings);

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

  type BaseOptions = {
    after?: string;
  };

  type EventOptions = BaseOptions &
    Partial<{
      defaultPublic: boolean;
      linkPrevious: boolean;
      lastEventId: string;
    }>;

  /**
   * Adds an event to rundown
   */
  const addEvent = useCallback(
    async (event: Partial<OntimeRundownEntry>, options?: EventOptions) => {
      const newEvent: Partial<OntimeRundownEntry> = { ...event };

      // ************* CHECK OPTIONS specific to events
      if (isOntimeEvent(newEvent)) {
        const applicationOptions = {
          after: options?.after,
          defaultPublic: options?.defaultPublic ?? defaultPublic,
          lastEventId: options?.lastEventId,
          linkPrevious: options?.linkPrevious ?? linkPrevious,
        };

        if (applicationOptions.linkPrevious && applicationOptions?.lastEventId) {
          newEvent.linkStart = applicationOptions.lastEventId;
        } else if (applicationOptions?.lastEventId) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know this is a value
          const rundownData = queryClient.getQueryData<RundownCached>(RUNDOWN)!;
          const { rundown } = rundownData;
          const previousEvent = rundown[applicationOptions.lastEventId];
          if (isOntimeEvent(previousEvent)) {
            newEvent.timeStart = previousEvent.timeEnd;
          }
        }

        if (applicationOptions.defaultPublic) {
          newEvent.isPublic = true;
        }

        if (newEvent.duration === undefined && newEvent.timeEnd === undefined) {
          newEvent.duration = forgivingStringToMillis(defaultDuration);
        }
      }

      // handle adding options that concern all event type
      if (options?.after) {
        newEvent.after = options.after;
      }

      try {
        await _addEventMutation.mutateAsync(newEvent);
      } catch (error) {
        logAxiosError('Failed adding event', error);
      }
    },
    [_addEventMutation, defaultDuration, defaultPublic, linkPrevious],
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
      const previousData = queryClient.getQueryData<RundownCached>(RUNDOWN);
      const eventId = newEvent.id;

      if (previousData && eventId) {
        // optimistically update object
        const newRundown = { ...previousData.rundown };
        // @ts-expect-error -- we expect the events to be of same type
        newRundown[eventId] = { ...newRundown[eventId], ...newEvent };
        queryClient.setQueryData(RUNDOWN, { order: previousData.order, rundown: newRundown, revision: -1 });
      }

      // Return a context with the previous and new events
      return { previousData, newEvent };
    },
    // Mutation fails, rollback undoes optimist update
    onError: (_error, _newEvent, context) => {
      queryClient.setQueryData(RUNDOWN, context?.previousData);
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
    async (event: Partial<OntimeRundownEntry>) => {
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
      updateEvent({ id: eventId, custom: { [field]: { value } } });
    },
    [updateEvent],
  );

  type TimeField = 'timeStart' | 'timeEnd' | 'duration';
  /**
   * Updates time of existing event
   */
  const updateTimer = useCallback(
    async (eventId: string, field: TimeField, value: string) => {
      const getPreviousEnd = (): number => {
        const cachedRundown = queryClient.getQueryData<RundownCached>(RUNDOWN);

        if (!cachedRundown?.order || !cachedRundown?.rundown) {
          return 0;
        }

        const index = cachedRundown.order.indexOf(eventId);
        if (index === 0) {
          return 0;
        }
        let previousEnd = 0;
        for (let i = index - 1; i >= 0; i--) {
          const event = cachedRundown.rundown[cachedRundown.order[i]];
          if (isOntimeEvent(event)) {
            previousEnd = event.timeEnd;
            break;
          }
        }
        return previousEnd;
      };

      let newValMillis = 0;

      // check for previous keyword
      if (value === 'p' || value === 'prev' || value === 'previous') {
        newValMillis = getPreviousEnd();

        // check for adding time keyword
      } else if (value.startsWith('+') || value.startsWith('p+') || value.startsWith('p +')) {
        // TODO: is this logic solid?
        const remainingString = value.substring(1);
        newValMillis = getPreviousEnd() + forgivingStringToMillis(remainingString);
      } else {
        newValMillis = forgivingStringToMillis(value);
      }

      const newEvent = {
        id: eventId,
        [field]: newValMillis,
      };
      try {
        await _updateEventMutation.mutateAsync(newEvent);
      } catch (error) {
        logAxiosError('Error updating event', error);
      }
    },
    [_updateEventMutation, queryClient],
  );

  /**
   * Toggles link of an event to the previous
   */
  const linkTimer = useCallback(
    async (eventId: string, linkStart: MaybeString) => {
      let newEvent: Partial<OntimeEvent> = { id: eventId };

      if (!linkStart) {
        newEvent.linkStart = null;
      } else {
        const cachedRundown = queryClient.getQueryData<RundownCached>(RUNDOWN);
        if (!cachedRundown) {
          return;
        }
        const currentEvent = cachedRundown.rundown[eventId] as OntimeEvent;
        if (!isOntimeEvent(currentEvent)) {
          return;
        }
        const { previousEvent } = getPreviousEventNormal(cachedRundown.rundown, cachedRundown.order, eventId);

        if (!previousEvent) {
          newEvent.linkStart = null;
        } else {
          newEvent.linkStart = previousEvent.id;
          const timePatch = getLinkedTimes(currentEvent, previousEvent);
          newEvent = { ...newEvent, ...timePatch };
        }
      }

      try {
        await _updateEventMutation.mutateAsync(newEvent);
      } catch (error) {
        logAxiosError('Error updating event', error);
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
      const previousEvents = queryClient.getQueryData<RundownCached>(RUNDOWN);

      if (previousEvents) {
        const eventIds = new Set(ids);
        const newRundown = { ...previousEvents.rundown };

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

        queryClient.setQueryData(RUNDOWN, { order: previousEvents.order, rundown: newRundown, revision: -1 });
      }
      // Return a context with the previous and new events
      return { previousEvents };
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
    onError: (_error, _newEvent, context) => {
      queryClient.setQueryData(RUNDOWN, context?.previousEvents);
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
    onMutate: async (eventId) => {
      // cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: RUNDOWN });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<RundownCached>(RUNDOWN);

      if (previousData) {
        // optimistically update object
        const newOrder = previousData.order.filter((id) => id !== eventId);
        const newRundown = { ...previousData.rundown };
        delete newRundown[eventId];

        queryClient.setQueryData(RUNDOWN, {
          order: newOrder,
          rundown: newRundown,
          revision: -1,
        });
      }

      // Return a context with the previous and new events
      return { previousData };
    },

    // Mutation fails, rollback undoes optimist update
    onError: (_error, _eventId, context) => {
      queryClient.setQueryData(RUNDOWN, context?.previousData);
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
    async (eventId: string) => {
      try {
        await _deleteEventMutation.mutateAsync(eventId);
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
      const previousData = queryClient.getQueryData<RundownCached>(RUNDOWN);

      // optimistically update object
      queryClient.setQueryData(RUNDOWN, { rundown: {}, order: [], revision: -1 });

      // Return a context with the previous and new events
      return { previousData };
    },

    // Mutation fails, rollback undos optimist update
    onError: (_error, _eventId, context) => {
      queryClient.setQueryData(RUNDOWN, context?.previousData);
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
      const previousData = queryClient.getQueryData<RundownCached>(RUNDOWN);

      if (previousData) {
        // optimistically update object
        const newOrder = reorderArray(previousData.order, data.from, data.to);

        queryClient.setQueryData(RUNDOWN, { order: newOrder, rundown: previousData.rundown, revision: -1 });
      }

      // Return a context with the previous and new events
      return { previousData };
    },

    // Mutation fails, rollback undoes optimist update
    onError: (_error, _eventId, context) => {
      queryClient.setQueryData(RUNDOWN, context?.previousData);
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
      const previousData = queryClient.getQueryData<RundownCached>(RUNDOWN);
      if (previousData) {
        // optimistically update object
        const newRundown = { ...previousData.rundown };
        const eventA = previousData.rundown[from];
        const eventB = previousData.rundown[to];

        if (!isOntimeEvent(eventA) || !isOntimeEvent(eventB)) {
          return;
        }

        const { newA, newB } = swapEventData(eventA, eventB);
        newRundown[from] = newA;
        newRundown[to] = newB;

        queryClient.setQueryData(RUNDOWN, { order: previousData.order, rundown: newRundown, revision: -1 });
      }

      // Return a context with the previous events
      return { previousData };
    },

    // Mutation fails, rollback undoes optimist update
    onError: (_error, _eventId, context) => {
      queryClient.setQueryData(RUNDOWN, context?.previousData);
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
    linkTimer,
    reorderEvent,
    swapEvents,
    updateEvent,
    updateTimer,
    updateCustomField,
  };
};
