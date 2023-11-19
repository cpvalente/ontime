import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GetRundownCached, isOntimeEvent, OntimeRundownEntry } from 'ontime-types';
import { getCueCandidate, swapOntimeEvents } from 'ontime-utils';

import { RUNDOWN } from '../api/apiConstants';
import { logAxiosError } from '../api/apiUtils';
import {
  ReorderEntry,
  requestApplyDelay,
  requestDelete,
  requestDeleteAll,
  requestEventSwap,
  requestPostEvent,
  requestPutEvent,
  requestReorderEvent,
  SwapEntry,
} from '../api/eventsApi';
import { useEditorSettings } from '../stores/editorSettings';

/**
 * @description Set of utilities for events
 */
export const useEventAction = () => {
  const queryClient = useQueryClient();
  const eventSettings = useEditorSettings((state) => state.eventSettings);
  const defaultPublic = eventSettings.defaultPublic;
  const startTimeIsLastEnd = eventSettings.startTimeIsLastEnd;

  /**
   * Calls mutation to add new event
   * @private
   */
  const _addEventMutation = useMutation({
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    mutationFn: requestPostEvent,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RUNDOWN });
    },
    networkMode: 'always',
  });

  type BaseOptions = {
    after?: string;
  };

  type EventOptions = BaseOptions & {
    defaultPublic?: boolean;
    lastEventId?: string;
    startTimeIsLastEnd?: boolean;
  };

  /**
   * Adds an event to rundown
   */
  const addEvent = useCallback(
    async (event: Partial<OntimeRundownEntry>, options?: EventOptions) => {
      const newEvent: Partial<OntimeRundownEntry> = { ...event };

      // ************* CHECK OPTIONS specific to events
      if (isOntimeEvent(newEvent)) {
        const applicationOptions = {
          defaultPublic: options?.defaultPublic ?? defaultPublic,
          startTimeIsLastEnd: options?.startTimeIsLastEnd ?? startTimeIsLastEnd,
          lastEventId: options?.lastEventId,
          after: options?.after,
        };

        const rundown = queryClient.getQueryData<GetRundownCached>(RUNDOWN)?.rundown ?? [];

        if (newEvent?.cue === undefined) {
          newEvent.cue = getCueCandidate(rundown, options?.after);
        }

        // hard coding duration value to be as expected for now
        // this until timeOptions gets implemented
        if (newEvent?.timeStart !== undefined && newEvent.timeEnd !== undefined) {
          newEvent.duration = Math.max(0, newEvent?.timeEnd - newEvent?.timeStart) || 0;
        }

        if (applicationOptions.startTimeIsLastEnd && applicationOptions?.lastEventId) {
          const previousEvent = rundown.find((event) => event.id === applicationOptions.lastEventId);
          if (previousEvent !== undefined && previousEvent.type === 'event') {
            newEvent.timeStart = previousEvent.timeEnd;
            newEvent.timeEnd = previousEvent.timeEnd;
          }
        }

        if (applicationOptions.defaultPublic) {
          newEvent.isPublic = true;
        }
      }

      // handle adding options that concern all event type
      if (options?.after) {
        newEvent.after = options.after;
      }

      try {
        // @ts-expect-error -- we know that the object is well formed now
        await _addEventMutation.mutateAsync(newEvent);
      } catch (error) {
        logAxiosError('Failed adding event', error);
      }
    },
    [_addEventMutation, defaultPublic, queryClient, startTimeIsLastEnd],
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

      const previousData = queryClient.getQueryData<GetRundownCached>(RUNDOWN);

      if (previousData) {
        // optimistically update object
        const optimisticRundown = [...previousData.rundown];
        const index = optimisticRundown.findIndex((event) => event.id === newEvent.id);
        if (index > -1) {
          // @ts-expect-error -- we expect the event types to match
          optimisticRundown[index] = { ...optimisticRundown[index], ...newEvent };

          queryClient.setQueryData(RUNDOWN, { rundown: optimisticRundown, revision: -1 });
        }
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
      const previousData = queryClient.getQueryData<GetRundownCached>(RUNDOWN);

      if (previousData) {
        // optimistically update object
        const optimisticRundown = [...previousData.rundown];
        const index = optimisticRundown.findIndex((event) => event.id === eventId);
        if (index > -1) {
          optimisticRundown.splice(index, 1);

          queryClient.setQueryData(RUNDOWN, {
            rundown: optimisticRundown,
            revision: -1,
          });
        }
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
      const previousData = queryClient.getQueryData<GetRundownCached>(RUNDOWN);

      // optimistically update object
      queryClient.setQueryData(RUNDOWN, { rundown: [], revision: -1 });

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
      const previousData = queryClient.getQueryData<GetRundownCached>(RUNDOWN);

      if (previousData) {
        // optimistically update object
        const optimisticRundown = [...previousData.rundown];
        const [reorderedItem] = optimisticRundown.splice(data.from, 1);
        optimisticRundown.splice(data.to, 0, reorderedItem);

        queryClient.setQueryData(RUNDOWN, { rundown: optimisticRundown, revision: -1 });
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
          eventId: eventId,
          from: from,
          to: to,
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
      const previousData = queryClient.getQueryData<GetRundownCached>(RUNDOWN);
      if (previousData) {
        // optimistically update object
        const fromEventIndex = previousData.rundown.findIndex((event) => event.id === from);
        const toEventIndex = previousData.rundown.findIndex((event) => event.id === to);

        const optimisticRundown = swapOntimeEvents(previousData.rundown, fromEventIndex, toEventIndex);

        queryClient.setQueryData(RUNDOWN, { rundown: optimisticRundown, revision: -1 });
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
      // TODO: before calling `/swapEvents`,
      // we should determine the events are of type `OntimeEvent`
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
    updateEvent,
    deleteEvent,
    deleteAllEvents,
    applyDelay,
    reorderEvent,
    swapEvents,
  };
};
