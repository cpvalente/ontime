import { useState } from 'react';
import { Button } from '@chakra-ui/react';

import { getLatestVersion, HasUpdate } from '../../../../common/api/external';
import ExternalLink from '../../../../common/components/external-link/ExternalLink';

import style from '../Panel.module.scss';

type CheckFail = {
  error: string;
};

type CheckIsLatest = {
  latest: true;
};

type CheckRemote = CheckFail | CheckIsLatest | HasUpdate;

interface CheckUpdatesButtonProps {
  version: string;
}

export default function CheckUpdatesButton(props: CheckUpdatesButtonProps) {
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
    <>
      <Button
        onClick={versionCheck}
        variant='ontime-filled'
        isLoading={isFetching}
        isDisabled={disableButton}
        size='sm'
        maxWidth='max-content'
      >
        Check for updates
      </Button>
      <ResolveUpdateMessage updateMessage={updateMessage} />
    </>
  );
}

function ResolveUpdateMessage(props: { updateMessage: CheckRemote | null }) {
  const { updateMessage } = props;

  if (updateMessage && 'error' in updateMessage) {
    return <span className={style.error}>{updateMessage.error}</span>;
  }
  if (updateMessage && 'url' in updateMessage) {
    return <ExternalLink href={updateMessage?.url}>{`New version available: ${updateMessage.version}`}</ExternalLink>;
  }
  return null;
}
