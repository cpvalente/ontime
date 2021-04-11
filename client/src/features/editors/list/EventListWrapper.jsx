import { useMutation, useQuery } from 'react-query';
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
  const { data, status, isError, refetch } = useQuery('events', fetchAllEvents);
  const addEvent = useMutation((data) => axios.post(eventsURL, data));
  const updateEvent = useMutation((data) => axios.put(eventsURL, data));
  const patchEvent = useMutation((data) => axios.patch(eventsURL, data));
  const deleteEvent = useMutation((eventId) =>
    axios.delete(eventsURL + '/' + eventId)
  );

  // Show toasts on errors
  useEffect(() => {
    if (isError) {
      showErrorToast('Error fetching data');
    }
  }, [isError]);

  // Events API
  const eventsHandler = async (action, payload) => {
    let needsRefetch = false;
    switch (action) {
      case 'add':
        try {
          await addEvent.mutateAsync(payload).then((needsRefetch = true));
        } catch (error) {
          showErrorToast('Error creating event', error.message);
        }
        break;
      case 'update':
        try {
          await updateEvent.mutateAsync(payload).then((needsRefetch = true));
          // TODO: instead of refetching, update the item here
        } catch (error) {
          showErrorToast('Error updating event', error.message);
        }
        break;
      case 'patch':
        try {
          await patchEvent.mutateAsync(payload).then((needsRefetch = true));
          // TODO: instead of refetching, update the item here
        } catch (error) {
          showErrorToast('Error updating event', error.message);
        }
        break;
      case 'delete':
        try {
          await deleteEvent.mutateAsync(payload).then((needsRefetch = true));
          needsRefetch = true;
        } catch (error) {
          showErrorToast('Error deleting event', error.message);
        }
        break;
      default:
        showErrorToast('Unrecognised request', action);
        break;
    }
    if (needsRefetch) {
      refetch();
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
