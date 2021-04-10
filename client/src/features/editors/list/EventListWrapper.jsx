import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useEffect } from 'react';
import { fetchAllEvents } from '../../../app/api/eventsApi.js';
import EventList from './EventList';
import EventListMenu from '../../menu/EventListMenu.jsx';
import axios from 'axios';
import { showErrorToast } from '../../../common/helpers/toastManager';
import { eventsURL } from '../../../app/api/eventsApi';
import { Skeleton } from '@chakra-ui/skeleton';
import style from './List.module.css';

export default function EventListWrapper() {
  const { data, status, isError } = useQuery('events', fetchAllEvents);
  const queryClient = useQueryClient();
  // TODO: Move to events API?
  const addEvent = useMutation((data) => axios.post(eventsURL, data));
  const updateEvent = useMutation((data) => axios.put(eventsURL, data));
  const deleteEvent = useMutation((eventId) =>
    axios.delete(eventsURL + eventId)
  );

  // Show toasts on errors
  useEffect(() => {
    if (isError) {
      showErrorToast('Error fetching data');
    }
  }, [isError]);

  // Events API
  const eventsHandler = async (action, payload) => {
    // Torbjorn: is this a good way to do it?
    // How do I handle the mutation thing
    // https://react-query.tanstack.com/guides/invalidations-from-mutations
    // https://react-query.tanstack.com/guides/updates-from-mutation-responses
    switch (action) {
      case 'add':
        try {
          const event = await addEvent
            .mutateAsync(payload)
            .then(queryClient.invalidateQueries('events'));
        } catch (error) {
          showErrorToast('Error creating event', error.message);
        }
        break;
      case 'update':
        try {
          const event = await updateEvent
            .mutateAsync(payload)
            .then(queryClient.invalidateQueries('events'));
        } catch (error) {
          showErrorToast('Error updating event', error.message);
        }
        break;
      case 'delete':
        try {
          const event = await deleteEvent
            .mutateAsync(payload)
            .then(queryClient.invalidateQueries('events'));
        } catch (error) {
          showErrorToast('Error deleting event', error.message);
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
