import { useState } from 'react';
import { Badge, useDisclosure } from '@chakra-ui/react';

import { RedirectClientModal } from '../../../../common/components/client-modal/RedirectClientModal';
import { RenameClientModal } from '../../../../common/components/client-modal/RenameClientModal';
import { setClientRemote } from '../../../../common/hooks/useSocket';
import { useClientStore } from '../../../../common/stores/clientStore';
import { Button } from '../../../../components/ui/button';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './ClientControlPanel.module.scss';

export default function ClientList() {
  const id = useClientStore((store) => store.id);
  const clients = useClientStore((store) => store.clients);
  const { open: isOpenRedirect, onOpen: onOpenRedirect, onClose: onCloseRedirect } = useDisclosure();
  const { open: isOpenRename, onOpen: onOpenRename, onClose: onCloseRename } = useDisclosure();
  const { setIdentify } = setClientRemote;

  const [targetId, setTargetId] = useState('');

  const openRename = (targetId: string) => {
    setTargetId(targetId);
    onOpenRename();
  };

  const openRedirect = (targetId: string) => {
    setTargetId(targetId);
    onOpenRedirect();
  };

  const ontimeClients = Object.entries(clients).filter(([_, { type }]) => type === 'ontime');
  const otherClients = Object.entries(clients).filter(([_, { type }]) => type !== 'ontime');

  const targetClient = clients[targetId];

  return (
    <>
      {isOpenRedirect && (
        <RedirectClientModal
          id={targetId}
          name={targetClient?.name}
          path={targetClient?.path}
          isOpen={isOpenRedirect}
          onClose={onCloseRedirect}
        />
      )}
      {isOpenRename && (
        <RenameClientModal id={targetId} name={targetClient?.name} isOpen={isOpenRename} onClose={onCloseRename} />
      )}
      <Panel.Section>
        <Panel.Title>Ontime Clients ({ontimeClients.length})</Panel.Title>
        <Panel.Table>
          <thead>
            <tr>
              <td className={style.fullWidth}>Client Name (Connection ID)</td>
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
                  <td className={style.badgeList}>
                    <Badge variant='outline' size='xs'>
                      {key}
                    </Badge>
                    {isCurrent && (
                      <Badge variant='outline' colorScheme='yellow' size='xs'>
                        self
                      </Badge>
                    )}
                    {name}
                  </td>
                  {isCurrent ? <td /> : <td className={style.pathList}>{path}</td>}
                  <td className={style.actionButtons}>
                    <Button
                      size='xs'
                      className={`${identify ? style.blink : ''}`}
                      disabled={isCurrent}
                      variant={identify ? 'ontime-filled' : 'ontime-subtle'}
                      data-testid={isCurrent ? '' : 'not-self-identify'}
                      onClick={() => {
                        setIdentify({ target: key, identify: !identify });
                      }}
                    >
                      Identify
                    </Button>
                    <Button
                      size='xs'
                      variant='ontime-subtle'
                      data-testid={isCurrent ? '' : 'not-self-rename'}
                      onClick={() => openRename(key)}
                    >
                      Rename
                    </Button>

                    <Button
                      size='xs'
                      variant='ontime-subtle'
                      disabled={isCurrent}
                      data-testid={isCurrent ? '' : 'not-self-redirect'}
                      onClick={() => openRedirect(key)}
                    >
                      Redirect
                    </Button>
                  </td>
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
              <td className={style.halfWidth}>Client Name (Connection ID)</td>
              <td className={style.halfWidth}>Client type</td>
            </tr>
          </thead>
          <tbody>
            {otherClients.map(([key, client]) => {
              const { name, type } = client;

              return (
                <tr key={key}>
                  <td className={style.badgeList}>
                    <Badge variant='outline' size='sm'>
                      {key}
                    </Badge>
                    {name}
                  </td>
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
