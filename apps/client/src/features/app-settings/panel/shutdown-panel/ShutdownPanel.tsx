import { useDisclosure } from '@mantine/hooks';
import { useRef } from 'react';

import Button from '../../../../common/components/buttons/Button';
import Dialog from '../../../../common/components/dialog/Dialog';
import Info from '../../../../common/components/info/Info';
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
        <Panel.Card>
          <Panel.SubHeader>Shutdown</Panel.SubHeader>
          <Panel.Divider />
          {isOntimeCloud ? (
            <Info type='warning'>
              For security reasons, shutting down the server must be done from the Ontime Cloud dashboard.
            </Info>
          ) : (
            <Panel.Field
              title='Stop the Ontime server'
              description='The runtime state will be lost, but your project is kept for next time.'
            />
          )}
          {!isOntimeCloud && (
            <Panel.Section>
              <Button variant='destructive' onClick={handler.open} disabled={!canShutdown}>
                Shutdown ontime
              </Button>
              {!canShutdown && <Panel.Description>Only available from the machine running Ontime.</Panel.Description>}
            </Panel.Section>
          )}
        </Panel.Card>
      </Panel.Section>
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
    </>
  );
}
