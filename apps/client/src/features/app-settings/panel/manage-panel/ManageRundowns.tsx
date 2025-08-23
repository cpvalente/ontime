import { useState } from 'react';
import { IoAdd } from 'react-icons/io5';
import { useDisclosure } from '@mantine/hooks';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Dialog from '../../../../common/components/dialog/Dialog';
import Tag from '../../../../common/components/tag/Tag';
import { useMutateProjectRundowns, useProjectRundowns } from '../../../../common/hooks-query/useProjectRundowns';
import { cx } from '../../../../common/utils/styleUtils';
import * as Panel from '../../panel-utils/PanelUtils';

import { ManageRundownForm } from './ManageRundownForm';

import style from './ManagePanel.module.scss';

export default function ManageRundowns() {
  const { data } = useProjectRundowns();
  const { remove, load } = useMutateProjectRundowns();
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

  const submitRundownDelete = async () => {
    try {
      await remove(targetRundown);
    } catch (error) {
      setActionError(`Failed to delete rundown. ${maybeAxiosError(error)}`);
    } finally {
      deleteHandlers.close();
    }
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
                      <Panel.InlineElements as='td'>
                        <Button size='small' onClick={() => openLoad(id)} disabled={isLoaded}>
                          Load
                        </Button>
                        <Button
                          size='small'
                          variant='subtle-destructive'
                          onClick={() => openDelete(id)}
                          disabled={isLoaded}
                        >
                          Delete
                        </Button>
                      </Panel.InlineElements>
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
