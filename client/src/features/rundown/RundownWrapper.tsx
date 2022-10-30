import { useContext, useEffect } from 'react';
import Empty from 'common/components/state/Empty';
import { LoggingContext } from 'common/context/LoggingContext';
import RundownMenu from 'features/menu/RundownMenu';

import useRundown from '../../common/hooks-query/useRundown';

import Rundown from './Rundown';

import styles from '../editors/Editor.module.scss';

export default function RundownWrapper() {
  const { emitError } = useContext(LoggingContext);
  const { data, status, isError } = useRundown();

  useEffect(() => {
    if (isError) {
      emitError('Error fetching data');
    }
  }, [emitError, isError]);

  return (
    <>
      <RundownMenu />
      <div className={styles.content}>
        {status === 'success' && data ? (
          <Rundown entries={data} />
        ) : (
          <Empty text='Connecting to server' />
        )}
      </div>
    </>
  );
}
