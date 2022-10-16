import { useCallback, useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EVENTS_TABLE, EVENTS_TABLE_KEY } from '../api/apiConstants';
import {
  requestApplyDelay,
  requestDelete,
  requestDeleteAll,
  requestPost,
  requestPut,
  requestReorder,
} from '../api/eventsApi';
import { LoggingContext } from '../context/LoggingContext';

/**
 * @description Set of utilities for events
 */
export const useEventAction = () => {
  const queryClient = useQueryClient();
  const { emitError } = useContext(LoggingContext);

  /**
   * @description Calls mutation to add new event
   * @private
   */
  const _addEventMutation = useMutation(requestPost, {
    // we optimistically update here
    onMutate: async (newEvent) => {
      // cancel ongoing queries
      await queryClient.cancelQueries(EVENTS_TABLE, { exact: true });

      // Snapshot the previous value
      let previousEvents = queryClient.getQueryData(EVENTS_TABLE);
      if (previousEvents == null) {
        await queryClient.invalidateQueries(EVENTS_TABLE);
        previousEvents = queryClient.getQueryData(EVENTS_TABLE);
      }

      // optimistically update object, temp ID until refetch
      const optimistic = [...previousEvents];
      let insertAfterIndex = 0;
      if (newEvent.after) {
        const index = optimistic.findIndex((event) => event.id === newEvent?.after);
        if (index > -1) {
          insertAfterIndex = index + 1;
        }
      } else if (newEvent.order) {
        insertAfterIndex = newEvent.order;
      }

      optimistic.splice(insertAfterIndex, 0, {
        ...newEvent,
        id: new Date().toISOString(),
      });
      queryClient.setQueryData(EVENTS_TABLE, optimistic);

      // Return a context with the previous and new events
      return { previousEvents };
    },

    // Mutation fails, rollback undoes optimist update
    onError: (error, newEvent, context) => {
      queryClient.setQueryData(EVENTS_TABLE, context.previousEvents);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries(EVENTS_TABLE);
    },
  });

  /**
   * @description Adds new event to list
   * @param {object} event - Event to be added
   * @param {object} [options] - Event options
   */
  const addEvent = useCallback(
    async (event, options) => {
      const newEvent = { ...event };

      // ************* CHECK OPTIONS
      // there is an option to pass an index of an array to use as start time
      if (typeof options?.startIsLastEnd !== 'undefined') {
        const events = queryClient.getQueryData(EVENTS_TABLE);
        const previousEvent = events.find((event) => event.id === options.startIsLastEnd);
        newEvent.timeStart = previousEvent.timeEnd || 0;
      }

      // hard coding duration value to be as expected for now
      // this until timeOptions gets implemented
      if (newEvent.type === 'event') {
        newEvent.duration = Math.max(0, newEvent.timeEnd - newEvent.timeStart) || 0;
      }

      try {
        await _addEventMutation.mutateAsync(newEvent);
      } catch (error) {
        emitError(`Error fetching data: ${error.message}`);
      }
    },
    [_addEventMutation, emitError],
  );

  /**
   * @description Calls mutation to update existing event
   * @private
   */
  const _updateEventMutation = useMutation(requestPut, {
    // we optimistically update here
    onMutate: async (newEvent) => {
      // cancel ongoing queries
      await queryClient.cancelQueries([EVENTS_TABLE_KEY, newEvent.id]);

      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData([EVENTS_TABLE_KEY, newEvent.id]);

      // optimistically update object
      queryClient.setQueryData([EVENTS_TABLE_KEY, newEvent.id], newEvent);

      // Return a context with the previous and new events
      return { previousEvent, newEvent };
    },

    // Mutation fails, rollback undoes optimist update
    onError: (error, newEvent, context) => {
      queryClient.setQueryData([EVENTS_TABLE, context.newEvent.id], context.previousEvent);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: async (newEvent) => {
      await queryClient.invalidateQueries([EVENTS_TABLE_KEY, newEvent.id]);
    },
  });

  /**
   * @description Updates existing event
   * @param {object} event - Event to be added
   */
  const updateEvent = useCallback(
    async (event) => {
      try {
        await _updateEventMutation.mutateAsync(event);
      } catch (error) {
        emitError(`Error updating event: ${error.message}`);
      }
    },
    [_updateEventMutation, emitError]
  );

  /**
   * @description Calls mutation to delete an event
   * @private
   */
  const _deleteEventMutation = useMutation(requestDelete, {
    // we optimistically update here
    onMutate: async (eventId) => {
      // cancel ongoing queries
      await queryClient.cancelQueries([EVENTS_TABLE_KEY, eventId]);

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(EVENTS_TABLE);

      const filtered = [...previousEvents].filter((e) => e.id !== eventId);

      // optimistically update object
      queryClient.setQueryData(EVENTS_TABLE, filtered);

      // Return a context with the previous and new events
      return { previousEvents };
    },

    // Mutation fails, rollback undoes optimist update
    onError: (error, eventId, context) => {
      queryClient.setQueryData(EVENTS_TABLE, context.previousEvents);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries(EVENTS_TABLE);
    },
  });

  /**
   * @description Deletes an event form the list
   * @param {object} eventId - Event to be deleted
   */
  const deleteEvent = useCallback(
    async (eventId) => {
      try {
        await _deleteEventMutation.mutateAsync(eventId);
      } catch (error) {
        emitError(`Error deleting event: ${error.message}`);
      }
    },
    [_deleteEventMutation, emitError],
  );

  /**
   * @description Calls mutation to delete all events
   * @private
   */
  const _deleteAllEventsMutation = useMutation(requestDeleteAll, {
    // we optimistically update here
    onMutate: async () => {
      // cancel ongoing queries
      await queryClient.cancelQueries(EVENTS_TABLE, { exact: true });

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(EVENTS_TABLE);

      const clear = [];

      // optimistically update object
      queryClient.setQueryData(EVENTS_TABLE, clear);

      // Return a context with the previous and new events
      return { previousEvents };
    },

    // Mutation fails, rollback undos optimist update
    onError: (error, eventId, context) => {
      queryClient.setQueryData(EVENTS_TABLE, context.previousEvents);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries(EVENTS_TABLE);
    },
  });

  /**
   * @description Deletes all events from list
   */
  const deleteAllEvents = useCallback(async () => {
    try {
      await _deleteAllEventsMutation.mutateAsync();
    } catch (error) {
      emitError(`Error deleting events: ${error.message}`);
    }
  }, [_deleteAllEventsMutation, emitError]);

  /**
   * @description Calls mutation to apply a delay
   * @private
   */
  const _applyDelayMutation = useMutation(requestApplyDelay, {
    // Mutation finished, failed or successful
    onSettled: () => {
      queryClient.invalidateQueries(EVENTS_TABLE);
    },
  });

  /**
   * @description Applies a given delay
   * @param {object} delayEventId - Id of delay to be applied
   */
  const applyDelay = useCallback(
    async (delayEventId) => {
      try {
        await _applyDelayMutation.mutateAsync(delayEventId);
      } catch (error) {
        emitError(`Error applying delay: ${error.message}`);
      }
    },
    [_applyDelayMutation, emitError],
  );

  /**
   * @description Calls mutation to reorder an event
   * @private
   */
  const _reorderEventMutation = useMutation(requestReorder, {
    // we optimistically update here
    onMutate: async (data) => {
      // cancel ongoing queries
      await queryClient.cancelQueries(EVENTS_TABLE, { exact: true });

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(EVENTS_TABLE);

      const e = [...previousEvents];
      const [reorderedItem] = e.splice(data.from, 1);
      e.splice(data.to, 0, reorderedItem);

      // optimistically update object
      queryClient.setQueryData(EVENTS_TABLE, e);

      // Return a context with the previous and new events
      return { previousEvents };
    },

    // Mutation fails, rollback undoes optimist update
    onError: (error, eventId, context) => {
      queryClient.setQueryData(EVENTS_TABLE, context.previousEvents);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries(EVENTS_TABLE);
    },
  });

  /**
   * @description Reorders a given event
   * @param {string} eventID - ID of event to reorder
   * @param {number} from - Current index
   * @param {number} to - New Index
   */
  const reorderEvent = useCallback(
    async (eventId, from, to) => {
      try {
        const reorderObject = {
          index: eventId,
          from: from,
          to: to,
        };
        await _reorderEventMutation.mutateAsync(reorderObject);
      } catch (error) {
        emitError(`Error re-ordering event: ${error.message}`);
      }
    },
    [_reorderEventMutation, emitError],
  );

  return { addEvent, updateEvent, deleteEvent, deleteAllEvents, applyDelay, reorderEvent };
};
