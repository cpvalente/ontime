import { useCallback, useRef } from 'react';
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
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { useAppMode } from '../../../common/stores/appModeStore';
import { useEventSelection } from '../useEventSelection';

import { useTranslation } from '../../../translation/TranslationProvider';

export default function RundownMenu() {
  const clearSelectedEvents = useEventSelection((state) => state.clearSelectedEvents);
  const appMode = useAppMode((state) => state.mode);
  const { deleteAllEvents } = useEventAction();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const deleteAll = useCallback(() => {
    deleteAllEvents();
    clearSelectedEvents();
    onClose();
  }, [clearSelectedEvents, deleteAllEvents, onClose]);

  const { getLocalizedString } = useTranslation();

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
        {getLocalizedString('editor.clear')}
      </Button>
      <AlertDialog variant='ontime' isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
              '{getLocalizedString('editor.clear')}'
            </AlertDialogHeader>
            <AlertDialogBody>
            {getLocalizedString('alert.clear_rundown')}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant='ontime-ghosted-white'>
              {getLocalizedString('global.cancel')}
              </Button>
              <Button colorScheme='red' onClick={deleteAll} ml={4}>
              {getLocalizedString('global.delete_all')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
