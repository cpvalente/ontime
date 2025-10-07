import { useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';

import Button from '../../../../common/components/buttons/Button';
import Dialog from '../../../../common/components/dialog/Dialog';
import { useElectronEvent } from '../../../../common/hooks/useElectronEvent';
import { isLocalhost, isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

export default function ShutdownPanel() {
  const { isElectron, sendToElectron } = useElectronEvent();
  const [isOpen, handler] = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const sendShutdown = () => {
    sendToElectron('shutdown', 'now');
    handler.close();
  };

  const canShutdown = isElectron || isLocalhost;

  return (
    <>
      <Panel.Header>Shutdown Ontime</Panel.Header>
      <Panel.Section>
        {isOntimeCloud ? (
          <Panel.Highlight>
            For security reasons, shutting down the server must be done from the Ontime Cloud dashboard.
          </Panel.Highlight>
        ) : (
          <Panel.Paragraph>
            This will shutdown the Ontime server. <br />
            The runtime state will be lost, but your project is kept for next time.
          </Panel.Paragraph>
        )}
        <Button variant='destructive' onClick={handler.open} disabled={!(isElectron || isLocalhost)}>
          Shutdown ontime
        </Button>
        {!canShutdown && (
          <Panel.Description>Note: Ontime can only be shutdown from the machine it is running in.</Panel.Description>
        )}
        <Dialog
          isOpen={isOpen}
          title='Shutdown Ontime'
          showCloseButton
          onClose={handler.close}
          bodyElements={
            <Panel.Paragraph>
              This will shutdown the Ontime server. <br /> Are you sure?
            </Panel.Paragraph>
          }
          footerElements={
            <>
              <Button ref={cancelRef} onClick={handler.close} variant='ghosted-white'>
                Cancel
              </Button>
              <Button variant='destructive' onClick={sendShutdown} disabled={!canShutdown}>
                Shutdown
              </Button>
            </>
          }
        />
      </Panel.Section>
    </>
  );
}
