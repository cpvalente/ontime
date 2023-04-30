import { useState } from 'react';
import { Button } from '@chakra-ui/react';

import { getLatestVersion, HasUpdate } from '../../../common/api/ontimeApi';
import ModalLink from '../ModalLink';

import styles from '../Modal.module.scss';

interface UpdateCheckerProps {
  version: string;
}

type CheckFail = {
  error: string;
};

type CheckIsLatest = {
  latest: true;
};

type CheckRemote = CheckFail | CheckIsLatest | HasUpdate;

export default function UpdateChecker(props: UpdateCheckerProps) {
  const { version } = props;
  const [updateMessage, setUpdateMessage] = useState<CheckRemote | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  /**
   * Handles version comparison and returns component with message
   */
  const versionCheck = async () => {
    setIsFetching(true);

    try {
      const latest = await getLatestVersion();

      if (!latest.version.includes(version)) {
        // new version, pass data to component
        setUpdateMessage(latest);
      } else {
        setUpdateMessage({ latest: true });
      }
    } catch {
      setUpdateMessage({ error: 'Error reaching server' });
    } finally {
      setIsFetching(false);
    }
  };

  const disableButton = Boolean(updateMessage && 'version' in updateMessage);

  return (
    <div className={styles.updateSection}>
      <Button onClick={versionCheck} variant='ontime-filled' isLoading={isFetching} isDisabled={disableButton}>
        Check for updates
      </Button>
      <ResolveUpdateMessage updateMessage={updateMessage} />
    </div>
  );
}

function ResolveUpdateMessage(props: { updateMessage: CheckRemote | null }) {
  const { updateMessage } = props;

  if (updateMessage && 'error' in updateMessage) {
    return <span className={styles.error}>{updateMessage.error}</span>;
  }
  if (updateMessage && 'url' in updateMessage) {
    return <ModalLink href={updateMessage?.url}>{`New version available: ${updateMessage.version}`}</ModalLink>;
  }
  return null;
}
