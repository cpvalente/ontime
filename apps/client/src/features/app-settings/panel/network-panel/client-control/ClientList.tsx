import { useDisclosure } from '@mantine/hooks';
import { Client } from 'ontime-types';
import { useState } from 'react';

import Button from '../../../../../common/components/buttons/Button';
import { RedirectClientModal } from '../../../../../common/components/client-modal/RedirectClientModal';
import { RenameClientModal } from '../../../../../common/components/client-modal/RenameClientModal';
import CopyTag from '../../../../../common/components/copy-tag/CopyTag';
import Tag from '../../../../../common/components/tag/Tag';
import Tooltip from '../../../../../common/components/tooltip/Tooltip';
import { setClientRemote } from '../../../../../common/hooks/useSocket';
import { useClientStore } from '../../../../../common/stores/clientStore';
import { openLink } from '../../../../../common/utils/linkUtils';
import * as Panel from '../../../panel-utils/PanelUtils';

import style from './ClientControlPanel.module.scss';

/**
 * Shows the path a client is showing
 * The full URL is available for copying or opening in a new window
 */
function ClientPath({ origin, path }: { origin: string; path: string }) {
  // clients report their path on connection, we may not have it yet
  if (!path) {
    return <span className={style.muted}>unknown</span>;
  }

  // origin is empty for clients which have not reported their location
  if (!origin) {
    return <span className={style.copiable}>{path}</span>;
  }

  const fullUrl = `${origin}${path}`;

  return (
    <Tooltip text={fullUrl} render={<span />}>
      <CopyTag copyValue={fullUrl} size='small' onClick={() => openLink(fullUrl)}>
        {path}
      </CopyTag>
    </Tooltip>
  );
}

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
        <div className={style.note}>
          <Panel.Description>
            Ontime views connected to this server. Identify shows a marker in the client screen until you turn it off,
            redirect sends the client to a different view.
          </Panel.Description>
        </div>
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
                  <td>
                    <ClientPath origin={client.origin} path={path} />
                  </td>
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
        <div className={style.note}>
          <Panel.Description>
            Connections which are not Ontime views, such as integrations and custom clients. These cannot be controlled
            from Ontime.
          </Panel.Description>
        </div>
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
