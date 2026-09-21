import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';

import { ConnectionStatus, useConnectionStore } from '../../stores/connectionStore';
import { cx } from '../../utils/styleUtils';

import style from './ConnectionIndicator.module.scss';

/** how long we confirm a recovery before getting out of the way */
const recoveryNoticeDuration = 2500;

type ConnectionNotice = 'reconnecting' | 'disconnected' | 'recovered';

const labels: Record<ConnectionNotice, string> = {
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
  recovered: 'Connected',
};

/**
 * Communicates interruptions to the server connection.
 * Interruptions we expect to recover on their own never reach this point, see the connection store.
 */
export default function ConnectionIndicator() {
  const { status, recoveredAt } = useConnectionStore(
    useShallow((state) => ({ status: state.status, recoveredAt: state.recoveredAt })),
  );
  const [isRecoveryVisible, setIsRecoveryVisible] = useState(false);

  // keep a recovery on screen long enough to be read
  useEffect(() => {
    if (recoveredAt === null) {
      return;
    }

    setIsRecoveryVisible(true);
    const timeout = setTimeout(() => setIsRecoveryVisible(false), recoveryNoticeDuration);
    return () => clearTimeout(timeout);
  }, [recoveredAt]);

  const notice = getNotice(status, isRecoveryVisible);

  if (notice === null) {
    return null;
  }

  return (
    <div className={cx([style.indicator, style[notice]])} role='status' aria-live='polite'>
      <span className={style.dot} />
      {labels[notice]}
    </div>
  );
}

function getNotice(status: ConnectionStatus, isRecoveryVisible: boolean): ConnectionNotice | null {
  switch (status) {
    case ConnectionStatus.Reconnecting:
      return 'reconnecting';
    case ConnectionStatus.Disconnected:
      return 'disconnected';
    case ConnectionStatus.Connected:
      return isRecoveryVisible ? 'recovered' : null;
  }
}
