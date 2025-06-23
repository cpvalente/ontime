import { memo, useCallback } from 'react';
import { IoTrash } from 'react-icons/io5';
import { useDisclosure } from '@mantine/hooks';

import Button from '../../../common/components/buttons/Button';
import Dialog from '../../../common/components/dialog/Dialog';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { AppMode, useAppMode } from '../../../common/stores/appModeStore';
import { useEventSelection } from '../useEventSelection';

import style from './RundownHeader.module.scss';

export default memo(RundownMenu);
function RundownMenu() {
  const [isOpen, handlers] = useDisclosure();

  const clearSelectedEvents = useEventSelection((state) => state.clearSelectedEvents);
  const appMode = useAppMode((state) => state.mode);
  const { deleteAllEntries } = useEntryActions();

  const deleteAll = useCallback(() => {
    deleteAllEntries();
    clearSelectedEvents();
    handlers.close();
  }, [clearSelectedEvents, deleteAllEntries, handlers]);

  return (
    <>
      <Button
        variant='subtle-destructive'
        className={style.apart}
        onClick={() => handlers.open()}
        disabled={appMode === AppMode.Run}
      >
        <IoTrash />
        Clear all
      </Button>
      <Dialog
        isOpen={isOpen}
        onClose={handlers.close}
        title='Clear rundown'
        showBackdrop
        showCloseButton
        bodyElements={
          <>
            You will lose all data in your rundown. <br /> Are you sure?
          </>
        }
        footerElements={
          <>
            <Button size='large' onClick={handlers.close}>
              Cancel
            </Button>
            <Button variant='destructive' size='large' onClick={deleteAll}>
              Delete all
            </Button>
          </>
        }
      />
    </>
  );
}
