import { IoAdd } from 'react-icons/io5';
import { useDisclosure } from '@mantine/hooks';

import Button from '../../../../common/components/buttons/Button';
import Dialog from '../../../../common/components/dialog/Dialog';
import { useProjectRundowns } from '../../../../common/hooks-query/useProjectRundowns';
import { cx } from '../../../../common/utils/styleUtils';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './ProjectPanel.module.scss';

export default function ManageRundowns() {
  const { data } = useProjectRundowns();
  const [deleteOpen, deleteHandlers] = useDisclosure();
  const [loadOpen, loadHandlers] = useDisclosure();

  return (
    <>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>
            Manage project rundowns
            <Panel.InlineElements>
              <Button onClick={() => undefined} disabled>
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
              {data.rundowns.map((rundown) => {
                const isLoaded = data.loaded === rundown.id;
                return (
                  <tr key={rundown.id} className={cx([isLoaded && style.current])}>
                    <td>{rundown.numEntries}</td>
                    <td>{`${rundown.title}${isLoaded && ' (loaded)'}`}</td>
                    <Panel.InlineElements as='td'>
                      <Button size='small' onClick={() => loadHandlers.open()} disabled={isLoaded}>
                        Load
                      </Button>
                      <Button
                        size='small'
                        variant='subtle-destructive'
                        onClick={() => deleteHandlers.open()}
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
        isOpen={deleteOpen}
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
            <Button variant='destructive' size='large' onClick={() => undefined}>
              Delete rundown
            </Button>
          </>
        }
      />
      <Dialog
        isOpen={loadOpen}
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
            <Button variant='primary' size='large' onClick={() => undefined}>
              Load rundown
            </Button>
          </>
        }
      />
    </>
  );
}
