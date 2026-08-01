import { useDisclosure } from '@mantine/hooks';
import { Client } from 'ontime-types';
import { useState } from 'react';

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

  /**
   * Clients are given by the server in connection order, which means rows move
   * as clients come and go. We keep a stable order: self first, then by name
   */
  const sortClients = (clientEntries: [string, Client][]) =>
    clientEntries.sort(([keyA, clientA], [keyB, clientB]) => {
      if (keyA === id) return -1;
      if (keyB === id) return 1;
      return clientA.name.localeCompare(clientB.name);
    });

  const ontimeClients = sortClients(Object.entries(clients).filter(([_, { type }]) => type === 'ontime'));
  const otherClients = sortClients(Object.entries(clients).filter(([_, { type }]) => type !== 'ontime'));

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
              <th style={{ width: '20%' }}>Client Name</th>
              <th>Path</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ontimeClients.length === 0 && <Panel.TableEmpty label='No Ontime clients connected' />}
            {ontimeClients.map(([key, client]) => {
              const { identify, name, path } = client;
              const isCurrent = id === key;
              return (
                <tr key={key} data-highlight={isCurrent}>
                  <Panel.InlineElements relation='inner' as='td'>
                    {isCurrent && <Tag>SELF</Tag>}
                    {name}
                  </Panel.InlineElements>
                  <td className={style.copiable}>{path}</td>
                  <Panel.InlineElements relation='inner' as='td'>
                    <Button
                      size='small'
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
              <th className={style.halfWidthNoWrap}>Client Name</th>
              <th className={style.halfWidthNoWrap}>Client type</th>
            </tr>
          </thead>
          <tbody>
            {otherClients.length === 0 && <Panel.TableEmpty label='No other clients connected' />}
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
