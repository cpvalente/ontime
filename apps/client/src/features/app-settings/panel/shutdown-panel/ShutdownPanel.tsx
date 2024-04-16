import { useRef } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  useDisclosure,
} from '@chakra-ui/react';

import useElectronEvent from '../../../../common/hooks/useElectronEvent';
import * as Panel from '../PanelUtils';

export default function ShutdownPanel() {
  const { isElectron, sendToElectron } = useElectronEvent();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const sendShutdown = () => {
    sendToElectron('shutdown', 'now');
  };

  return (
    <>
      <Panel.Header>Shutdown Ontime</Panel.Header>
      <Panel.Section>
        <Panel.Paragraph>
          This will shutdown the Ontime server. <br />
          The runtime state will be lost, but your project is kept for next time.
        </Panel.Paragraph>
        <Button colorScheme='red' onClick={onOpen} isDisabled={!isElectron}>
          Shutdown ontime
        </Button>
        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                Ontime Shutdown
              </AlertDialogHeader>
              <AlertDialogBody>
                This will shutdown the Ontime server. <br /> Are you sure?
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose} variant='ghost'>
                  Cancel
                </Button>
                <Button colorScheme='red' onClick={sendShutdown}>
                  Shutdown
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Panel.Section>
    </>
  );
}
