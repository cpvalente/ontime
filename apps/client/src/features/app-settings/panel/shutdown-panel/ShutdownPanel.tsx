import { useRef } from 'react';
import { useDisclosure } from '@chakra-ui/react';

import { Button } from '../../../../common/components/ui/button';
import {
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from '../../../../common/components/ui/dialog';
import { useElectronEvent } from '../../../../common/hooks/useElectronEvent';
import { isLocalhost, isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

export default function ShutdownPanel() {
  const { isElectron, sendToElectron } = useElectronEvent();
  const { open, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const sendShutdown = () => {
    sendToElectron('shutdown', 'now');
    onClose();
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
        <Button colorPalette='red' onClick={onOpen} maxWidth='350px' disabled={!(isElectron || isLocalhost)}>
          Shutdown ontime
        </Button>
        {!canShutdown && (
          <Panel.Description>Note: Ontime can only be shutdown from the machine it is running in.</Panel.Description>
        )}
        <DialogRoot open={open} initialFocusEl={() => cancelRef.current} onOpenChange={onClose}>
          <DialogBackdrop />
          <DialogContent>
            <DialogHeader fontSize='lg' fontWeight='bold'>
              Ontime Shutdown
            </DialogHeader>
            <DialogBody>
              This will shutdown the Ontime server. <br /> Are you sure?
            </DialogBody>
            <DialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant='ontime-ghosted-white'>
                Cancel
              </Button>
              <Button colorPalette='red' onClick={sendShutdown} disabled={!canShutdown}>
                Shutdown
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </Panel.Section>
    </>
  );
}
