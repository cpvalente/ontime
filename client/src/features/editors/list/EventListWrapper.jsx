import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { EVENTS_TABLE } from 'app/api/apiConstants';
import { LoggingContext } from '../../../app/context/LoggingContext';
import {
  fetchAllEvents,
  requestApplyDelay,
  requestDelete,
  requestDeleteAll,
  requestPatch,
  requestPost,
  requestPut,
  requestReorder,
} from 'app/api/eventsApi.js';
import { useFetch } from 'app/hooks/useFetch.js';
import EventList from './EventList';
import EventListMenu from 'features/menu/EventListMenu.jsx';
import Empty from 'common/state/Empty';
import { CollapseContext } from '../../../app/context/CollapseContext';

export default function EventListWrapper() {
  const { expandAll, collapseMultiple } = useContext(CollapseContext);
  const queryClient = useQueryClient();
  const { emitError } = useContext(LoggingContext);
  const { data, status, isError, refetch } = useFetch(EVENTS_TABLE, fetchAllEvents);
  const [events, setEvents] = useState(null);

  const addEvent = useMutation(requestPost, {
    // we optimistically update here
    onMutate: async (newEvent) => {
      // cancel ongoing queries
      queryClient.cancelQueries(EVENTS_TABLE, { exact: true });

      // Snapshot the previous value
      let previousEvents = queryClient.getQueryData(EVENTS_TABLE);
      if (previousEvents == null) {
        refetch();
        previousEvents = queryClient.getQueryData(EVENTS_TABLE);
      }

      // optimistically update object, temp ID until refetch
      let optimistic = [...previousEvents];
      optimistic.splice(newEvent.order, 0, {
        ...newEvent,
        id: new Date().toISOString(),
      });
      queryClient.setQueryData(EVENTS_TABLE, optimistic);

      // Return a context with the previous and new todo
      return { previousEvents };
    },

    // Mutation fails, rollback undos optimist update
    onError: (error, newEvent, context) => {
      queryClient.setQueryData(EVENTS_TABLE, context.previousEvents);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries(EVENTS_TABLE);
    },
  });

  const updateEvent = useMutation(requestPut, {
    // we optimistically update here
    onMutate: async (newEvent) => {
      // cancel ongoing queries
      queryClient.cancelQueries([EVENTS_TABLE, newEvent.id]);

      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData([EVENTS_TABLE, newEvent.id]);

      // optimistically update object
      queryClient.setQueryData([EVENTS_TABLE, newEvent.id], newEvent);

      // Return a context with the previous and new todo
      return { previousEvent, newEvent };
    },

    // Mutation fails, rollback undos optimist update
    onError: (error, newEvent, context) => {
      queryClient.setQueryData([EVENTS_TABLE, context.newEvent.id], context.previousEvent);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: (newEvent) => {
      queryClient.invalidateQueries([EVENTS_TABLE, newEvent.id]);
    },
  });

  const patchEvent = useMutation(requestPatch, {
    // we optimistically update here
    onMutate: async (newEvent) => {
      // cancel ongoing queries
      queryClient.cancelQueries([EVENTS_TABLE, newEvent.id]);

      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData([EVENTS_TABLE, newEvent.id]);

      // optimistically update object
      queryClient.setQueryData([EVENTS_TABLE, newEvent.id], newEvent);

      // Return a context with the previous and new todo
      return { previousEvent, newEvent };
    },

    // Mutation fails, rollback undos optimist update
    onError: (error, newEvent, context) => {
      queryClient.setQueryData([EVENTS_TABLE, context.newEvent.id], context.previousEvent);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: (newEvent) => {
      if (newEvent) {
        queryClient.invalidateQueries([EVENTS_TABLE, newEvent.id]);
      } else {
        queryClient.invalidateQueries(EVENTS_TABLE);
      }
    },
  });

  const deleteEvent = useMutation(requestDelete, {
    // we optimistically update here
    onMutate: async (eventId) => {
      // cancel ongoing queries
      queryClient.cancelQueries([EVENTS_TABLE, eventId]);

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(EVENTS_TABLE);

      let filtered = [...previousEvents];
      filtered.filter((e) => e.id === 'eventId');

      // optimistically update object
      queryClient.setQueryData(EVENTS_TABLE, filtered);

      // Return a context with the previous and new todo
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

  const deleteAllEvents = useMutation(requestDeleteAll, {
    // we optimistically update here
    onMutate: async () => {
      // cancel ongoing queries
      queryClient.cancelQueries(EVENTS_TABLE, { exact: true });

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(EVENTS_TABLE);

      let clear = [];

      // optimistically update object
      queryClient.setQueryData(EVENTS_TABLE, clear);

      // Return a context with the previous and new todo
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

  const applyDelay = useMutation(requestApplyDelay, {
    // Mutation finished, failed or successful
    onSettled: () => {
      queryClient.invalidateQueries(EVENTS_TABLE);
    },
  });

  const reorderEvent = useMutation(requestReorder, {
    // we optimistically update here
    onMutate: async (data) => {
      // cancel ongoing queries
      queryClient.cancelQueries(EVENTS_TABLE, { exact: true });

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(EVENTS_TABLE);

      const e = [...previousEvents];
      const [reorderedItem] = e.splice(data.from, 1);
      e.splice(data.to, 0, reorderedItem);

      // optimistically update object
      queryClient.setQueryData(EVENTS_TABLE, e);

      // Return a context with the previous and new todo
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

  // Show toasts on errors
  useEffect(() => {
    if (isError) {
      emitError('Error fetching data');
    }
  }, [emitError, isError]);

  // Events API
  const eventsHandler = useCallback(
    async (action, payload, options = undefined) => {
      switch (action) {
        case 'add':
          try {
            let newEvent = { ...payload };
            // there is an option to pass an index of an array to use as start time
            if (options?.startIsLastEnd !== undefined) {
              newEvent.timeStart = data[options.startIsLastEnd].timeEnd || 0;
            }
            // hard coding duration value to be as expected for now
            // this until timeOptions gets implemented
            // Todo: implement duration options
            newEvent.duration = Math.max(0, newEvent.timeEnd - newEvent.timeStart) || 0;
            await addEvent.mutateAsync(newEvent);
          } catch (error) {
            emitError(`Error fetching data: ${error.message}`);
          }
          break;
        case 'update':
          try {
            await updateEvent.mutateAsync(payload);
          } catch (error) {
            emitError(`Error updating event: ${error.message}`);
          }
          break;
        case 'patch':
          try {
            await patchEvent.mutateAsync(payload);
          } catch (error) {
            emitError(`Error updating event: ${error.message}`);
          }
          break;
        case 'delete':
          try {
            await deleteEvent.mutateAsync(payload);
          } catch (error) {
            emitError(`Error deleting event: ${error.message}`);
          }
          break;
        case 'reorder':
          try {
            await reorderEvent.mutateAsync(payload);
          } catch (error) {
            emitError(`Error re-ordering event: ${error.message}`);
          }
          break;
        case 'applyDelay':
          // if delay <= 0 delete delay and next block
          if (payload.duration <= 0) {
            try {
              // look for block after
              let afterId = false;
              let blockAfter = null;
              for (const d of data) {
                if (d.id === payload.id) afterId = true;
                if (afterId && d.type === 'block') {
                  blockAfter = d.id;
                  break;
                }
              }

              // delete delay
              await deleteEvent.mutateAsync(payload.id);
              // delete block after, if any
              if (blockAfter) await deleteEvent.mutateAsync(blockAfter);
            } catch (error) {
              emitError(`Error applying delay: ${error.message}`);
            }
          } else {
            try {
              await applyDelay.mutateAsync(payload.id);
            } catch (error) {
              emitError(`Error applying delay: ${error.message}`);
            }
          }
          break;

        case 'collapseall':
          if (data == null) return;
          collapseMultiple(data);
          break;

        case 'expandall':
          if (data == null) return;
          expandAll();
          break;

        case 'deleteall':
          try {
            await deleteAllEvents.mutateAsync();
          } catch (error) {
            emitError(`Error deleting events: ${error.message}`);
          }
          break;
        default:
          emitError(`Unhandled request: ${action}`);
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  // Front end should handle bad arguments
  useEffect(() => {
    if (data == null) return;
    setEvents(data.filter((d) => Object.keys(d).length > 0));
  }, [data]);

  return (
    <>
      <EventListMenu eventsHandler={eventsHandler} />
      {status === 'success' && events != null ? (
        <EventList events={events} eventsHandler={eventsHandler} />
      ) : (
        <Empty text='Connecting to server' />
      )}
    </>
  );
}
