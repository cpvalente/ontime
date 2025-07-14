import { useState } from 'react';
import { IoAdd } from 'react-icons/io5';
import { useDisclosure } from '@mantine/hooks';

import { deleteRundown, loadRundown, newRundown } from '../../../../common/api/rundown';
import Button from '../../../../common/components/buttons/Button';
import Dialog from '../../../../common/components/dialog/Dialog';
import Input from '../../../../common/components/input/input/Input';
import Tag from '../../../../common/components/tag/Tag';
import { useProjectRundowns } from '../../../../common/hooks-query/useProjectRundowns';
import { cx } from '../../../../common/utils/styleUtils';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './ManagePanel.module.scss';

export default function ManageRundowns() {
  const { data, refetch } = useProjectRundowns();
  const [isOpenDelete, deleteHandlers] = useDisclosure();
  const [isOpenLoad, loadHandlers] = useDisclosure();
  const [isNewLoad, newHandlers] = useDisclosure();
  const [value, setValue] = useState('');

  const openLoad = (id: string) => {
    setValue(id);
    loadHandlers.open();
  };

  const openDelete = (id: string) => {
    setValue(id);
    deleteHandlers.open();
  };

  const submitRundownLoad = async () => {
    try {
      await loadRundown(value);
      loadHandlers.close();
    } catch (err) {
      //TODO: show the error somewhere
      console.error(err);
    }
  };

  const submitRundownDelete = async () => {
    try {
      await deleteRundown(value);
      deleteHandlers.close();
    } catch (err) {
      //TODO: show the error somewhere
      console.error(err);
    } finally {
      refetch();
    }
  };

  const submitRundownNew = async () => {
    try {
      await newRundown(value);
      newHandlers.close();
    } catch (err) {
      //TODO: show the error somewhere
      console.error(err);
    } finally {
      refetch();
    }
  };

  return (
    <>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>
            Manage project rundowns
            <Panel.InlineElements>
              <Button onClick={newHandlers.open}>
                New <IoAdd />
              </Button>
            </Panel.InlineElements>
          </Panel.SubHeader>
          <Panel.Divider />
          <Panel.Table>
            <thead>
              <tr>
                <th># Entries</th>
                <th style={{ width: '100%' }}>Title</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.rundowns.map(({ id, numEntries, title }) => {
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
        title='Delete rundown'
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
      <Dialog
        isOpen={isNewLoad}
        onClose={newHandlers.close}
        title='Delete rundown'
        showBackdrop
        showCloseButton
        bodyElements={
          <>
            Write the name of the new rundown
            <Input fluid onChange={(e) => setValue(e.target.value)} />
          </>
        }
        footerElements={
          <>
            <Button size='large' onClick={newHandlers.close}>
              Cancel
            </Button>
            <Button variant='primary' size='large' onClick={submitRundownNew}>
              Create rundown
            </Button>
          </>
        }
      />
    </>
  );
}
