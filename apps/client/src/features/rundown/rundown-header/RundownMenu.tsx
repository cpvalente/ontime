import { memo, useCallback } from 'react';
import { IoEllipsisHorizontal, IoList, IoTrash } from 'react-icons/io5';
import { Toolbar } from '@base-ui/react/toolbar';
import { useDisclosure } from '@mantine/hooks';

import Button from '../../../common/components/buttons/Button';
import IconButton from '../../../common/components/buttons/IconButton';
import Dialog from '../../../common/components/dialog/Dialog';
import { DropdownMenu } from '../../../common/components/dropdown-menu/DropdownMenu';
import { useEntryActionsContext } from '../../../common/context/EntryActionsContext';
import useAppSettingsNavigation from '../../app-settings/useAppSettingsNavigation';
import { useEventSelection } from '../useEventSelection';

import style from './RundownHeader.module.scss';

interface RundownMenuProps {
  allowNavigation?: boolean;
}

export default memo(RundownMenu);
function RundownMenu({ allowNavigation }: RundownMenuProps) {
  const [isOpen, handlers] = useDisclosure();

  const clearSelectedEvents = useEventSelection((state) => state.clearSelectedEvents);
  const { deleteAllEntries } = useEntryActionsContext();
  const { setLocation } = useAppSettingsNavigation();

  const deleteAll = useCallback(() => {
    deleteAllEntries();
    clearSelectedEvents();
    handlers.close();
  }, [clearSelectedEvents, deleteAllEntries, handlers]);

  return (
    <>
      <div className={style.apart}>
        <DropdownMenu
          render={<Toolbar.Button render={<IconButton variant='subtle-white' aria-label='Rundown menu' />} />}
          items={[
            {
              type: 'item',
              label: 'Manage Rundowns...',
              icon: IoList,
              onClick: () => setLocation('manage'),
              disabled: !allowNavigation,
            },
            { type: 'divider' },
            {
              type: 'destructive',
              label: 'Clear all',
              icon: IoTrash,
              onClick: handlers.open,
            },
          ]}
        >
          <IoEllipsisHorizontal />
        </DropdownMenu>
      </div>

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
