import { useCallback, useRef } from 'react';
import { Button, useDisclosure } from '@chakra-ui/react';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { useAppMode } from '../../../common/stores/appModeStore';
import {
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from '../../../components/ui/dialog';
import { useEventSelection } from '../useEventSelection';

export default function RundownMenu() {
  const clearSelectedEvents = useEventSelection((state) => state.clearSelectedEvents);
  const appMode = useAppMode((state) => state.mode);
  const { deleteAllEvents } = useEventAction();

  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const deleteAll = useCallback(() => {
    deleteAllEvents();
    clearSelectedEvents();
    onClose();
  }, [clearSelectedEvents, deleteAllEvents, onClose]);

  return (
    <>
      <Button
        size='sm'
        variant='ontime-outlined'
        leftIcon={<IoTrash />}
        onClick={onOpen}
        color='#FA5656'
        isDisabled={appMode === 'run'}
      >
        Clear rundown
      </Button>
      <DialogRoot variant='ontime' isOpen={isOpen} leastDestructiveRef={cancelRef} onOpenChange={onClose}>
        <DialogBackdrop />
        <DialogContent>
          <DialogHeader fontSize='lg' fontWeight='bold'>
            Clear rundown
          </DialogHeader>
          <DialogBody>
            You will lose all data in your rundown. <br /> Are you sure?
          </DialogBody>
          <DialogFooter>
            <Button ref={cancelRef} onClick={onClose} variant='ontime-ghosted-white'>
              Cancel
            </Button>
            <Button colorScheme='red' onClick={deleteAll} ml={4}>
              Delete all
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
