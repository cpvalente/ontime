import { useDisclosure } from '@mantine/hooks';
import { useRef } from 'react';

import Button from '../../../../common/components/buttons/Button';
import Dialog from '../../../../common/components/dialog/Dialog';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import { useElectronEvent } from '../../../../common/hooks/useElectronEvent';
import { capabilities, dashboardUrl, isLocalhost } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

export default function ShutdownPanel() {
  const { isElectron, sendToElectron } = useElectronEvent();
  const [isOpen, handler] = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const sendShutdown = () => {
    sendToElectron('shutdown', 'now');
    handler.close();
  };

  const isServerMachine = isElectron || isLocalhost;

  return (
    <>
      <Panel.Header>Shutdown Ontime</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>Shutdown</Panel.SubHeader>
          <Panel.Divider />
          {capabilities.canShutdown ? (
            <>
              <Panel.Field
                title='Stop the Ontime server'
                description='The runtime state will be lost, but your project is kept for next time.'
              />
              <Panel.Section>
                <Button variant='destructive' onClick={handler.open} disabled={!isServerMachine}>
                  Shutdown Ontime
                </Button>
                {!isServerMachine && (
                  <Panel.Description>Only available from the machine running Ontime.</Panel.Description>
                )}
              </Panel.Section>
            </>
          ) : (
            <>
              <Panel.Field
                title='Ontime Cloud dashboard'
                description='For security reasons, shutting down the server must be done from the Ontime Cloud dashboard, along with stage control, backups and overview.'
              />
              {dashboardUrl && (
                <Panel.Section>
                  <ExternalLink href={dashboardUrl}>Open the Ontime Cloud dashboard</ExternalLink>
                </Panel.Section>
              )}
            </>
          )}
        </Panel.Card>
      </Panel.Section>
      <Dialog
        isOpen={isOpen}
        title='Shutdown Ontime'
        showCloseButton
        onClose={handler.close}
        bodyElements={<Panel.Paragraph>Shut down the Ontime server?</Panel.Paragraph>}
        footerElements={
          <>
            <Button ref={cancelRef} onClick={handler.close} variant='ghosted-white'>
              Cancel
            </Button>
            <Button variant='destructive' onClick={sendShutdown} disabled={!isServerMachine}>
              Shutdown
            </Button>
          </>
        }
      />
    </>
  );
}
