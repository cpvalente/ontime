import { useCallback } from 'react';
import { Button } from '@chakra-ui/react';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { useAppMode } from '../../../common/stores/appModeStore';
import { useEventSelection } from '../useEventSelection';

export default function RundownMenu() {
  const clearSelectedEvents = useEventSelection((state) => state.clearSelectedEvents);
  const setCursor = useAppMode((state) => state.setCursor);
  const appMode = useAppMode((state) => state.mode);
  const { deleteAllEvents } = useEventAction();

  const deleteAll = useCallback(() => {
    deleteAllEvents();
    clearSelectedEvents();
    setCursor(null);
  }, [clearSelectedEvents, deleteAllEvents, setCursor]);

  return (
    <Button
      size='sm'
      variant='ontime-outlined'
      leftIcon={<IoTrash />}
      onClick={deleteAll}
      color='#FA5656'
      isDisabled={appMode === 'run'}
    >
      Clear rundown
    </Button>
  );
}
