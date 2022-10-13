import { useContext, useEffect } from 'react';
import { EVENTS_TABLE } from 'common/api/apiConstants';
import { fetchAllEvents } from 'common/api/eventsApi';
import Empty from 'common/components/state/Empty';
import { LoggingContext } from 'common/context/LoggingContext';
import { useFetch } from 'common/hooks/useFetch';
import EventListMenu from 'features/menu/EventListMenu';

import EventList from './EventList';

import styles from '../Editor.module.scss';

export default function EventListWrapper() {
  const { emitError } = useContext(LoggingContext);
  const { data, status, isError } = useFetch(EVENTS_TABLE, fetchAllEvents, { placeholderData: [] });

  useEffect(() => {
    if (isError) {
      emitError('Error fetching data');
    }
  }, [emitError, isError]);

  return (
    <>
      <EventListMenu />
      <div className={styles.content}>
        {status === 'success' && data ? (
          <EventList events={data} />
        ) : (
          <Empty text='Connecting to server' />
        )}
      </div>
    </>
  );
}
