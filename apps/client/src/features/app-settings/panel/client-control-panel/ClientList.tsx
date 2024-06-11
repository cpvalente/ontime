import { useState } from 'react';
import { Badge, Button, useDisclosure } from '@chakra-ui/react';

import { RedirectClientModal } from '../../../../common/components/client-modal/RedirectClientModal';
import { RenameClientModal } from '../../../../common/components/client-modal/RenameClientModal';
import { setClientRemote } from '../../../../common/hooks/useSocket';
import { useClientStore } from '../../../../common/stores/clientStore';
import * as Panel from '../PanelUtils';

import style from './ClientControlPanel.module.scss';

export default function ClientList() {
  const { id, clients } = useClientStore();
  const { isOpen: isOpenRedirect, onOpen: onOpenRedirect, onClose: onCloseRedirect } = useDisclosure();
  const { isOpen: isOpenRename, onOpen: onOpenRename, onClose: onCloseRename } = useDisclosure();
  const { setIdentify, setRedirect, setClientName } = setClientRemote;

  const [targetId, setTargetId] = useState('');

  const openRename = (targetId: string) => {
    setTargetId(targetId);
    onOpenRename();
  };

  const onRename = (rename: string) => {
    setClientName({ target: targetId, rename });
    onCloseRename();
  };

  const openRedirect = (targetId: string) => {
    setTargetId(targetId);
    onOpenRedirect();
  };

  const onRedirect = (redirect: string) => {
    setRedirect({ target: targetId, redirect });
    onCloseRedirect();
  };

  const ontimeClients = Object.entries(clients).filter(([_, { type }]) => type === 'ontime');
  const otherClients = Object.entries(clients).filter(([_, { type }]) => type !== 'ontime');

  return (
    <>
      <RedirectClientModal
        onClose={onCloseRedirect}
        isOpen={isOpenRedirect}
        clients={clients}
        id={targetId}
        onSubmit={onRedirect}
      />
      <RenameClientModal
        onClose={onCloseRename}
        isOpen={isOpenRename}
        clients={clients}
        id={targetId}
        onSubmit={onRename}
      />
      <Panel.Title>Ontime Clients</Panel.Title>
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
                  <Badge variant='outline' size='sx'>
                    {key}
                  </Badge>
                  <Badge hidden={!isCurrent} variant='outline' colorScheme='yellow' size='sx'>
                    self
                  </Badge>
                  {name}
                </td>
                <td className={style.pathList}>{path}</td>
                <td className={style.actionButtons}>
                  <Button
                    size='xs'
                    className={`${identify ? style.blink : ''}`}
                    isDisabled={isCurrent}
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
                    isDisabled={isCurrent}
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
      <Panel.Divider />
      <Panel.Title>Other Clients</Panel.Title>
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
                  <Badge variant='outline' size='sx'>
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
    </>
  );
}
