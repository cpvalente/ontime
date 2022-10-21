import { useContext, useEffect } from 'react';
import Empty from 'common/components/state/Empty';
import { LoggingContext } from 'common/context/LoggingContext';
import EventListMenu from 'features/menu/EventListMenu';

import useEventsList from '../../../common/hooks-query/useEventsList';

import EventList from './EventList';

import styles from '../Editor.module.scss';

export default function EventListWrapper() {
  const { emitError } = useContext(LoggingContext);
  const { data, status, isError } = useEventsList();

  useEffect(() => {
    if (isError) {
      emitError('Error fetching data');
    }
  }, [emitError, isError]);

  return (
    <div className={styles.content}>
      <EventListMenu />
      {status === 'success' && data ? (
        <EventList events={data} />
      ) : (
        <Empty text='Connecting to server' />
      )}
    </div>
  );
}
