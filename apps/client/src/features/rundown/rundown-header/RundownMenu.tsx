import { memo, useCallback } from 'react';
import { Button } from '@chakra-ui/react';
import { IoTrashOutline } from '@react-icons/all-files/io5/IoTrashOutline';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { useAppMode } from '../../../common/stores/appModeStore';
import { useEventSelection } from '../useEventSelection';

export default memo(RundownMenu);

function RundownMenu() {
  const clearSelectedEvents = useEventSelection((state) => state.clearSelectedEvents);
  const setCursor = useAppMode((state) => state.setCursor);
  const { deleteAllEvents } = useEventAction();

  const deleteAll = useCallback(() => {
    deleteAllEvents();
    clearSelectedEvents();
    setCursor(null);
  }, [clearSelectedEvents, deleteAllEvents, setCursor]);

  return (
    <Button size='sm' variant='ontime-outlined' leftIcon={<IoTrashOutline />} onClick={deleteAll} color='#FA5656'>
      Clear rundown
    </Button>
  );
}
