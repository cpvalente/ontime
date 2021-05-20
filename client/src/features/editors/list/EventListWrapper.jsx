import { useMutation, useQueryClient } from 'react-query';
import { useCallback, useEffect } from 'react';
import {
  fetchAllEvents,
  requestPatch,
  requestPost,
  requestPut,
  requestDelete,
  requestDeleteAll,
  requestReorder,
  requestApplyDelay,
} from 'app/api/eventsApi.js';
import EventList from './EventList';
import EventListMenu from 'features/menu/EventListMenu.jsx';
import { showErrorToast } from 'common/helpers/toastManager';
import { useFetch } from 'app/hooks/useFetch.js';
import Empty from 'common/state/Empty';
import { EVENTS_TABLE } from 'app/api/apiConstants';
import { BatchOperation } from 'app/context/collapseAtom';
import { useAtom } from 'jotai';

export default function EventListWrapper() {
  const [, setCollapsed] = useAtom(BatchOperation);
  const queryClient = useQueryClient();
  const { data, status, isError, refetch } = useFetch(
    EVENTS_TABLE,
    fetchAllEvents
  );

  const addEvent = useMutation(requestPost, {
    // we optimistically update here
    onMutate: async (newEvent) => {
      // cancel ongoing queries
      queryClient.cancelQueries(EVENTS_TABLE, { exact: true });

      // Snapshot the previous value
      let previousEvents = queryClient.getQueryData(EVENTS_TABLE);
      console.log('debug', previousEvents);
      if (previousEvents == null) {
        refetch();
        previousEvents = queryClient.getQueryData(EVENTS_TABLE);
      }
      console.log('debug 2', previousEvents);

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
      const previousEvent = queryClient.getQueryData([
        EVENTS_TABLE,
        newEvent.id,
      ]);

      // optimistically update object
      queryClient.setQueryData([EVENTS_TABLE, newEvent.id], newEvent);

      // Return a context with the previous and new todo
      return { previousEvent, newEvent };
    },

    // Mutation fails, rollback undos optimist update
    onError: (error, newEvent, context) => {
      queryClient.setQueryData(
        [EVENTS_TABLE, context.newEvent.id],
        context.previousEvent
      );
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
      const previousEvent = queryClient.getQueryData([
        EVENTS_TABLE,
        newEvent.id,
      ]);

      // optimistically update object
      queryClient.setQueryData([EVENTS_TABLE, newEvent.id], newEvent);

      // Return a context with the previous and new todo
      return { previousEvent, newEvent };
    },

    // Mutation fails, rollback undos optimist update
    onError: (error, newEvent, context) => {
      queryClient.setQueryData(
        [EVENTS_TABLE, context.newEvent.id],
        context.previousEvent
      );
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: (newEvent) => {
      queryClient.invalidateQueries([EVENTS_TABLE, newEvent.id]);
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
      showErrorToast('Error fetching data');
    }
  }, [isError]);

  // Events API
  const eventsHandler = useCallback(
    async (action, payload) => {
      switch (action) {
        case 'add':
          try {
            let t = Date.now();
            await addEvent.mutateAsync(payload);
            console.log('debug m add', Date.now() - t);
          } catch (error) {
            showErrorToast('Error creating event', error.message);
          }
          break;
        case 'update':
          try {
            let t = Date.now();
            await updateEvent.mutateAsync(payload);
            console.log('debug m update', Date.now() - t);
          } catch (error) {
            showErrorToast('Error updating event', error.message);
          }
          break;
        case 'patch':
          try {
            let t = Date.now();
            await patchEvent.mutateAsync(payload);
            console.log('debug m patch', Date.now() - t);
          } catch (error) {
            showErrorToast('Error updating event', error.message);
          }
          break;
        case 'delete':
          try {
            let t = Date.now();
            await deleteEvent.mutateAsync(payload);
            console.log('debug m delete', Date.now() - t);
          } catch (error) {
            showErrorToast('Error deleting event', error.message);
          }
          break;
        case 'reorder':
          try {
            let t = Date.now();
            await reorderEvent.mutateAsync(payload);
            console.log('debug m reorder', Date.now() - t);
          } catch (error) {
            showErrorToast('Error reordering event', error.message);
          }
          break;
        case 'applyDelay':
          let t = Date.now();

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
              showErrorToast('Error applying delay', error.message);
            }
          } else {
            console.log('debug applydelay', payload.id);
            try {
              await applyDelay.mutateAsync(payload.id);
            } catch (error) {
              showErrorToast('Error applying delay', error.message);
            }
          }
          console.log('debug m apply', Date.now() - t);
          break;

        case 'collapseall':
          if (data == null) return;
          setCollapsed({ clear: true, items: data, isCollapsed: true });
          break;
        case 'expandall':
          if (data == null) return;
          setCollapsed({ clear: true, items: data, isCollapsed: false });
          break;

        case 'deleteall':
          try {
            let t = Date.now();
            await deleteAllEvents.mutateAsync();
            console.log('debug m deleteall', Date.now() - t);
          } catch (error) {
            showErrorToast('Error deleting events', error.message);
          }
          break;
        default:
          showErrorToast('Unrecognised request', action);
          break;
      }
    },
    [data]
  );

  return (
    <>
      <EventListMenu eventsHandler={eventsHandler} />
      {status === 'success' ? (
        <EventList events={data} eventsHandler={eventsHandler} />
      ) : (
        <Empty text='Connecting to server' />
      )}
    </>
  );
}
