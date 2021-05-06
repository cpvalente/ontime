import { useMutation, useQueryClient } from 'react-query';
import { useEffect } from 'react';
import {
  eventsNamespace,
  fetchAllEvents,
  requestPatch,
  requestPost,
  requestPut,
  requestDelete,
  requestReorder,
} from '../../../app/api/eventsApi.js';
import EventList from './EventList';
import EventListMenu from '../../menu/EventListMenu.jsx';
import { showErrorToast } from '../../../common/helpers/toastManager';
import { Skeleton } from '@chakra-ui/skeleton';
import { useFetch } from '../../../app/hooks/useFetch.js';

export default function EventListWrapper() {
  const queryClient = useQueryClient();
  const { data, status, isError, refetch } = useFetch(
    eventsNamespace,
    fetchAllEvents
  );

  const addEvent = useMutation(requestPost, {
    // we optimistically update here
    onMutate: async (newEvent) => {
      // cancel ongoing queries
      queryClient.cancelQueries(eventsNamespace, { exact: true });

      // Snapshot the previous value
      let previousEvents = queryClient.getQueryData(eventsNamespace);
      console.log('debug', previousEvents);
      if (previousEvents == null) {
        refetch();
        previousEvents = queryClient.getQueryData(eventsNamespace);
      }
      console.log('debug 2', previousEvents);

      // optimistically update object, temp ID until refetch
      let optimistic = [...previousEvents];
      optimistic.splice(newEvent.order, 0, {
        ...newEvent,
        id: new Date().toISOString(),
      });
      queryClient.setQueryData(eventsNamespace, optimistic);

      // Return a context with the previous and new todo
      return { previousEvents };
    },

    // Mutation fails, rollback undos optimist update
    onError: (error, newEvent, context) => {
      queryClient.setQueryData(eventsNamespace, context.previousEvents);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries(eventsNamespace);
    },
  });

  const updateEvent = useMutation(requestPut, {
    // we optimistically update here
    onMutate: async (newEvent) => {
      // cancel ongoing queries
      queryClient.cancelQueries([eventsNamespace, newEvent.id]);

      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData([
        eventsNamespace,
        newEvent.id,
      ]);

      // optimistically update object
      queryClient.setQueryData([eventsNamespace, newEvent.id], newEvent);

      // Return a context with the previous and new todo
      return { previousEvent, newEvent };
    },

    // Mutation fails, rollback undos optimist update
    onError: (error, newEvent, context) => {
      queryClient.setQueryData(
        [eventsNamespace, context.newEvent.id],
        context.previousEvent
      );
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: (newEvent) => {
      queryClient.invalidateQueries([eventsNamespace, newEvent.id]);
    },
  });

  const patchEvent = useMutation(requestPatch, {
    // we optimistically update here
    onMutate: async (newEvent) => {
      // cancel ongoing queries
      queryClient.cancelQueries([eventsNamespace, newEvent.id]);

      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData([
        eventsNamespace,
        newEvent.id,
      ]);

      // optimistically update object
      queryClient.setQueryData([eventsNamespace, newEvent.id], newEvent);

      // Return a context with the previous and new todo
      return { previousEvent, newEvent };
    },

    // Mutation fails, rollback undos optimist update
    onError: (error, newEvent, context) => {
      queryClient.setQueryData(
        [eventsNamespace, context.newEvent.id],
        context.previousEvent
      );
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: (newEvent) => {
      queryClient.invalidateQueries([eventsNamespace, newEvent.id]);
    },
  });

  const deleteEvent = useMutation(requestDelete, {
    // we optimistically update here
    onMutate: async (eventId) => {
      // cancel ongoing queries
      queryClient.cancelQueries([eventsNamespace, eventId]);

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(eventsNamespace);

      let filtered = [...previousEvents];
      filtered.filter((e) => e.id === 'eventId');

      // optimistically update object
      queryClient.setQueryData(eventsNamespace, filtered);

      // Return a context with the previous and new todo
      return { previousEvents };
    },

    // Mutation fails, rollback undos optimist update
    onError: (error, eventId, context) => {
      queryClient.setQueryData(eventsNamespace, context.previousEvents);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries(eventsNamespace);
    },
  });

  const reorderEvent = useMutation(requestReorder, {
    // we optimistically update here
    onMutate: async (data) => {
      // cancel ongoing queries
      queryClient.cancelQueries(eventsNamespace, { exact: true });

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(eventsNamespace);

      const e = [...previousEvents];
      const [reorderedItem] = e.splice(data.from, 1);
      e.splice(data.to, 0, reorderedItem);

      // optimistically update object
      queryClient.setQueryData(eventsNamespace, e);

      // Return a context with the previous and new todo
      return { previousEvents };
    },

    // Mutation fails, rollback undos optimist update
    onError: (error, eventId, context) => {
      queryClient.setQueryData(eventsNamespace, context.previousEvents);
    },
    // Mutation finished, failed or successful
    // Fetch anyway, just to be sure
    onSettled: () => {
      queryClient.invalidateQueries(eventsNamespace);
    },
  });

  // Show toasts on errors
  useEffect(() => {
    if (isError) {
      showErrorToast('Error fetching data');
    }
  }, [isError]);

  // Events API
  const eventsHandler = async (action, payload) => {
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
      default:
        showErrorToast('Unrecognised request', action);
        break;
    }
  };

  return (
    <>
      <EventListMenu eventsHandler={eventsHandler} />
      {status === 'success' ? (
        <EventList events={data} eventsHandler={eventsHandler} />
      ) : (
        <div className={style.eventContainer}>
          <Skeleton height='50vh' />
        </div>
      )}
    </>
  );
}
