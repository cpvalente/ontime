import { useDisclosure } from '@mantine/hooks';
import { Client } from 'ontime-types';
import { useMemo, useState } from 'react';

import Button from '../../../../../common/components/buttons/Button';
import { RedirectClientModal } from '../../../../../common/components/client-modal/RedirectClientModal';
import { RenameClientModal } from '../../../../../common/components/client-modal/RenameClientModal';
import CopyTag from '../../../../../common/components/copy-tag/CopyTag';
import Tag from '../../../../../common/components/tag/Tag';
import Tooltip from '../../../../../common/components/tooltip/Tooltip';
import { setClientRemote } from '../../../../../common/hooks/useSocket';
import { useClientStore } from '../../../../../common/stores/clientStore';
import { cx } from '../../../../../common/utils/styleUtils';
import * as Panel from '../../../panel-utils/PanelUtils';

import style from './ClientControlPanel.module.scss';

type ClientEntry = [string, Client];

/**
 * Clients arrive in whatever order the server broadcast them, which shuffles rows
 * whenever a client reconnects. Sorting by name keeps rows where the user last saw them.
 * Pass selfId to pin the current client to the top; only the ontime list can contain it.
 */
function sortClients(clients: ClientEntry[], selfId?: string): ClientEntry[] {
  return [...clients].sort(([keyA, clientA], [keyB, clientB]) => {
    if (selfId !== undefined) {
      if (keyA === selfId) return -1;
      if (keyB === selfId) return 1;
    }
    return clientA.name.localeCompare(clientB.name);
  });
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

  const { ontimeClients, otherClients } = useMemo(() => {
    const entries = Object.entries(clients);
    return {
      ontimeClients: sortClients(
        entries.filter(([_, { type }]) => type === 'ontime'),
        id,
      ),
      otherClients: sortClients(entries.filter(([_, { type }]) => type !== 'ontime')),
    };
  }, [clients, id]);

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
        <Panel.Description>
          Every browser window and Ontime view connected to this server. Use Identify to find a machine in the room, or
          Redirect to send it to another view.
        </Panel.Description>
        <Panel.Table>
          <thead>
            <tr>
              <th className={style.halfWidthNoWrap}>Client Name</th>
              <th>Path</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ontimeClients.length === 0 && <Panel.TableEmpty label='No Ontime clients connected.' />}
            {ontimeClients.map(([key, client]) => {
              const { identify, name, origin, path } = client;
              const isCurrent = id === key;
              const clientUrl = `${origin}${path}`;

              return (
                <tr key={key} className={cx([isCurrent && style.self])}>
                  <Panel.InlineElements relation='inner' as='td'>
                    {isCurrent && <Tag>SELF</Tag>}
                    <Tooltip text={`Connected through ${origin}`} render={<span />}>
                      {name}
                    </Tooltip>
                  </Panel.InlineElements>
                  <td className={style.copiable}>
                    <CopyTag size='small' copyValue={clientUrl}>
                      {path}
                    </CopyTag>
                  </td>
                  <Panel.InlineElements relation='inner' as='td'>
                    <Tooltip
                      text={
                        isCurrent
                          ? 'This is the window you are using'
                          : "Flash this client's name full-screen so you can find the machine in the room"
                      }
                      render={<span />}
                    >
                      <Button
                        size='small'
                        className={cx([identify && style.blink])}
                        disabled={isCurrent}
                        variant={identify ? 'primary' : 'subtle'}
                        data-testid={isCurrent ? '' : 'not-self-identify'}
                        onClick={() => {
                          setIdentify({ target: key, identify: !identify });
                        }}
                      >
                        Identify
                      </Button>
                    </Tooltip>
                    <Tooltip text="Give this client a name you'll recognise in this list" render={<span />}>
                      <Button
                        size='small'
                        data-testid={isCurrent ? '' : 'not-self-rename'}
                        onClick={() => openRename(key)}
                      >
                        Rename
                      </Button>
                    </Tooltip>
                    <Tooltip
                      text={
                        isCurrent ? 'This is the window you are using' : 'Send this client to a different Ontime view'
                      }
                      render={<span />}
                    >
                      <Button
                        size='small'
                        disabled={isCurrent}
                        data-testid={isCurrent ? '' : 'not-self-redirect'}
                        onClick={() => openRedirect(key)}
                      >
                        Redirect
                      </Button>
                    </Tooltip>
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
        <Panel.Description>
          Integrations connected over OSC, HTTP or websocket. These cannot be controlled from Ontime.
        </Panel.Description>
        <Panel.Table>
          <thead>
            <tr>
              <th className={style.halfWidthNoWrap}>Client Name</th>
              <th className={style.halfWidthNoWrap}>Client type</th>
            </tr>
          </thead>
          <tbody>
            {otherClients.length === 0 && (
              <Panel.TableEmpty label='No integrations connected. OSC, HTTP and websocket clients appear here.' />
            )}
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
