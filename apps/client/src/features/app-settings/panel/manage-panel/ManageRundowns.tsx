import { useState } from 'react';
import { IoAdd, IoDocumentOutline, IoDownloadOutline, IoDuplicateOutline, IoEllipsisHorizontal, IoTrash } from 'react-icons/io5';
import { useDisclosure } from '@mantine/hooks';

import { downloadAsExcel } from '../../../../common/api/excel';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Dialog from '../../../../common/components/dialog/Dialog';
import { DropdownMenu } from '../../../../common/components/dropdown-menu/DropdownMenu';
import Tag from '../../../../common/components/tag/Tag';
import { useMutateProjectRundowns, useProjectRundowns } from '../../../../common/hooks-query/useProjectRundowns';
import { cx } from '../../../../common/utils/styleUtils';
import * as Panel from '../../panel-utils/PanelUtils';

import { ManageRundownForm } from './ManageRundownForm';

import style from './ManagePanel.module.scss';

export default function ManageRundowns() {
  const { data } = useProjectRundowns();
  const { duplicate, remove, load } = useMutateProjectRundowns();
  const [isOpenDelete, deleteHandlers] = useDisclosure();
  const [isOpenLoad, loadHandlers] = useDisclosure();
  const [isNewLoad, newHandlers] = useDisclosure();
  const [targetRundown, setTargetRundown] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const openLoad = (id: string) => {
    setActionError(null);
    setTargetRundown(id);
    loadHandlers.open();
  };

  const openDelete = (id: string) => {
    setActionError(null);
    setTargetRundown(id);
    deleteHandlers.open();
  };

  const submitRundownLoad = async () => {
    try {
      await load(targetRundown);
    } catch (error) {
      setActionError(`Failed to load rundown. ${maybeAxiosError(error)}`);
    } finally {
      loadHandlers.close();
    }
  };

  const submitRundownDuplicate = async (id: string) => {
    setActionError(null);
    setRenamingRundown(null);
    setTargetRundown('');

    try {
      await duplicate(id);
    } catch (error) {
      setActionError(`Failed to duplicate rundown. ${maybeAxiosError(error)}`);
    }
  };

  const submitRundownDelete = async () => {
    try {
      await remove(targetRundown);
    } catch (error) {
      setActionError(`Failed to delete rundown. ${maybeAxiosError(error)}`);
    } finally {
      deleteHandlers.close();
    }
  };

  const handleDownloadXlsx = async (rundownId: string, title: string) => {
    await downloadAsExcel(rundownId, title);
  };

  return (
    <>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>
            Manage project rundowns
            <Panel.InlineElements>
              <Button
                onClick={() => {
                  setActionError(null);
                  newHandlers.open();
                }}
              >
                New <IoAdd />
              </Button>
            </Panel.InlineElements>
          </Panel.SubHeader>
          <Panel.Divider />
          <Panel.Section>
            {isNewLoad && <ManageRundownForm onClose={newHandlers.close} />}
            {actionError && <Panel.Error>{actionError}</Panel.Error>}
            <Panel.Table>
              <thead>
                <tr>
                  <th># Entries</th>
                  <th style={{ width: '100%' }}>Title</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.rundowns?.map(({ id, numEntries, title }) => {
                  const isLoaded = data.loaded === id;
                  return (
                    <tr key={id} className={cx([isLoaded && style.current])}>
                      <td>{numEntries}</td>
                      <td>
                        {title} {isLoaded && <Tag>Loaded</Tag>}
                      </td>
                      <td>
                        <DropdownMenu
                          render={<IconButton variant='ghosted-white' />}
                          items={[
                            {
                              type: 'item',
                              icon: IoDownloadOutline,
                              label: 'Load',
                              onClick: () => openLoad(id),
                              disabled: isLoaded,
                            },
                            {
                              type: 'item',
                              icon: IoDocumentOutline,
                              label: 'Download .xlsx',
                              onClick: () => handleDownloadXlsx(id, title),
                            },
                            {
                              type: 'item',
                              icon: IoDuplicateOutline,
                              label: 'Duplicate',
                              onClick: () => submitRundownDuplicate(id),
                            },
                            { type: 'divider' },
                            {
                              type: 'item',
                              icon: IoTrash,
                              label: 'Delete',
                              onClick: () => openDelete(id),
                              disabled: isLoaded,
                            },
                          ]}
                        >
                          <IoEllipsisHorizontal />
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Panel.Table>
          </Panel.Section>
        </Panel.Card>
      </Panel.Section>
      <Dialog
        isOpen={isOpenDelete}
        onClose={deleteHandlers.close}
        title='Load rundown'
        showBackdrop
        showCloseButton
        bodyElements={
          <>
            You will lose all data in your rundown. <br /> Are you sure?
          </>
        }
        footerElements={
          <>
            <Button size='large' onClick={deleteHandlers.close}>
              Cancel
            </Button>
            <Button variant='destructive' size='large' onClick={submitRundownDelete}>
              Delete rundown
            </Button>
          </>
        }
      />
      <Dialog
        isOpen={isOpenLoad}
        onClose={loadHandlers.close}
        title='Load rundown'
        showBackdrop
        showCloseButton
        bodyElements={
          <>
            The current playback will be stopped. <br /> Are you sure?
          </>
        }
        footerElements={
          <>
            <Button size='large' onClick={loadHandlers.close}>
              Cancel
            </Button>
            <Button variant='primary' size='large' onClick={submitRundownLoad}>
              Load rundown
            </Button>
          </>
        }
      />
    </>
  );
}
