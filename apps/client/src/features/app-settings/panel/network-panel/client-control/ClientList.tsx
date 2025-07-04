import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Client } from 'ontime-types';

import Button from '../../../../../common/components/buttons/Button';
import { RedirectClientModal } from '../../../../../common/components/client-modal/RedirectClientModal';
import { RenameClientModal } from '../../../../../common/components/client-modal/RenameClientModal';
import Tag from '../../../../../common/components/tag/Tag';
import { setClientRemote } from '../../../../../common/hooks/useSocket';
import { useClientStore } from '../../../../../common/stores/clientStore';
import * as Panel from '../../../panel-utils/PanelUtils';

import style from './ClientControlPanel.module.scss';

export default function ClientList() {
  const id = useClientStore((store) => store.id);
  const clients = useClientStore((store) => store.clients);
  const [isOpenRedirect, redirectHandler] = useDisclosure();
  const [isOpenRename, renameHandler] = useDisclosure();
  const { setIdentify } = setClientRemote;

  const [targetId, setTargetId] = useState('');

  const openRename = (targetId: string) => {
    setTargetId(targetId);
    renameHandler.open();
  };

  const openRedirect = (targetId: string) => {
    setTargetId(targetId);
    redirectHandler.open();
  };

  const ontimeClients = Object.entries(clients).filter(([_, { type }]) => type === 'ontime');
  const otherClients = Object.entries(clients).filter(([_, { type }]) => type !== 'ontime');

  const targetClient: Client | undefined = clients[targetId];

  return (
    <>
      {isOpenRedirect && targetClient !== undefined && (
        <RedirectClientModal
          id={targetId}
          name={targetClient.name}
          origin={targetClient.origin}
          currentPath={targetClient.path}
          isOpen={isOpenRedirect}
          onClose={redirectHandler.close}
        />
      )}
      {isOpenRename && (
        <RenameClientModal
          id={targetId}
          name={targetClient?.name}
          isOpen={isOpenRename}
          onClose={renameHandler.close}
        />
      )}
      <Panel.Section>
        <Panel.Title>Ontime Clients ({ontimeClients.length})</Panel.Title>
        <Panel.Table>
          <thead>
            <tr>
              <td className={style.halfWidth}>Client Name</td>
              <td className={style.fullWidth}>Path</td>
              <td />
            </tr>
          </thead>
          <tbody>
            {ontimeClients.map(([key, client]) => {
              const { identify, name, path } = client;
              const isCurrent = id === key;
              return (
                <tr key={key}>
                  <Panel.InlineElements relation='inner' as='td'>
                    {isCurrent && <Tag>SELF</Tag>}
                    {name}
                  </Panel.InlineElements>
                  <td>{path}</td>
                  <Panel.InlineElements relation='inner'>
                    <Button
                      size='small'
                      className={`${identify ? style.blink : ''}`}
                      disabled={isCurrent}
                      variant={identify ? 'primary' : 'subtle'}
                      data-testid={isCurrent ? '' : 'not-self-identify'}
                      onClick={() => {
                        setIdentify({ target: key, identify: !identify });
                      }}
                    >
                      Identify
                    </Button>
                    <Button
                      size='small'
                      data-testid={isCurrent ? '' : 'not-self-rename'}
                      onClick={() => openRename(key)}
                    >
                      Rename
                    </Button>

                    <Button
                      size='small'
                      disabled={isCurrent}
                      data-testid={isCurrent ? '' : 'not-self-redirect'}
                      onClick={() => openRedirect(key)}
                    >
                      Redirect
                    </Button>
                  </Panel.InlineElements>
                </tr>
              );
            })}
          </tbody>
        </Panel.Table>
      </Panel.Section>
      <Panel.Divider />
      <Panel.Section>
        <Panel.Title>Other Clients ({otherClients.length})</Panel.Title>
        <Panel.Table>
          <thead>
            <tr>
              <td className={style.halfWidthNoWrap}>Client Name</td>
              <td className={style.halfWidthNoWrap}>Client type</td>
            </tr>
          </thead>
          <tbody>
            {otherClients.map(([key, client]) => {
              const { name, type } = client;

              return (
                <tr key={key}>
                  <td>{name}</td>
                  <td>{type}</td>
                </tr>
              );
            })}
          </tbody>
        </Panel.Table>
      </Panel.Section>
    </>
  );
}
