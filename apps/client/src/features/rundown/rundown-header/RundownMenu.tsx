import { memo, useCallback } from 'react';
import { IoTrash } from 'react-icons/io5';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { useDisclosure, useSessionStorage } from '@mantine/hooks';

import Button from '../../../common/components/buttons/Button';
import Dialog from '../../../common/components/dialog/Dialog';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { AppMode, sessionKeys } from '../../../ontimeConfig';
import { useEventSelection } from '../useEventSelection';

import style from './RundownHeader.module.scss';

export default memo(RundownMenu);
function RundownMenu() {
  const [isOpen, handlers] = useDisclosure();

  const clearSelectedEvents = useEventSelection((state) => state.clearSelectedEvents);
  const [editorMode] = useSessionStorage({
    key: sessionKeys.cuesheetMode,
    defaultValue: AppMode.Edit,
  });
  const { deleteAllEntries } = useEntryActions();

  const deleteAll = useCallback(() => {
    deleteAllEntries();
    clearSelectedEvents();
    handlers.close();
  }, [clearSelectedEvents, deleteAllEntries, handlers]);

  return (
    <>
      <Toolbar.Button
        render={<Button variant='subtle-destructive' />}
        onClick={handlers.open}
        disabled={editorMode === AppMode.Run}
        className={style.apart}
      >
        <IoTrash />
        Clear all
      </Toolbar.Button>
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
            <Button variant='ghosted-white' size='large' onClick={handlers.close}>
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
