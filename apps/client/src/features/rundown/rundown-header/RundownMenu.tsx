import { useCallback, useRef } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';

import { Button } from '../../../common/components/ui/button';
import {
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from '../../../common/components/ui/dialog';
import { useEventAction } from '../../../common/hooks/useEventAction';
import { useAppMode } from '../../../common/stores/appModeStore';
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
      <Button size='sm' variant='ontime-outlined' onClick={onOpen} color='#FA5656' disabled={appMode === 'run'}>
        <IoTrash /> Clear rundown
      </Button>
      <DialogRoot open={isOpen} initialFocusEl={() => cancelRef.current} onOpenChange={onClose}>
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
            <Button color='red' onClick={deleteAll} ml={4}>
              Delete all
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
