import { useState } from 'react';
import { Badge, Button, useDisclosure } from '@chakra-ui/react';
import { ClientTypes } from 'ontime-types';

import { setClientRemote } from '../../../../common/hooks/useSocket';
import { useClientStore } from '../../../../common/stores/clientStore';
import * as Panel from '../PanelUtils';

import { RedirectModal } from './RedirectModal';
import { RenameModal } from './RenameModal';

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

  const rename = (name: string) => {
    setClientName({ target: targetId, name });
    onCloseRename();
  };

  const openRedirect = (targetId: string) => {
    setTargetId(targetId);
    onOpenRedirect();
  };

  const redirect = (path: string) => {
    setRedirect({ target: targetId, path });
    onCloseRedirect();
  };

  return (
    <>
      <RedirectModal
        onClose={onCloseRedirect}
        isOpen={isOpenRedirect}
        clients={clients}
        id={targetId}
        onSubmit={redirect}
      />
      <RenameModal onClose={onCloseRename} isOpen={isOpenRename} clients={clients} id={targetId} onSubmit={rename} />
      <Panel.Table>
        <thead>
          <tr>
            <td className={style.fullWidth}>Client Name (Connection ID)</td>
            <td />
          </tr>
        </thead>
        <tbody>
          {Object.entries(clients).map(([key, client]) => {
            const { identify, name, type } = client;
            const isCurrent = id === key;
            const disableRedirect = isCurrent || type != ClientTypes.Ontime;
            const disableRename = type != ClientTypes.Ontime;
            const disableIdentify = isCurrent || type != ClientTypes.Ontime;
            return (
              <tr key={key}>
                <td className={style.badgeList}>
                  <Badge variant='outline' size='sx' colorScheme={selectColorScheme[type]}>
                    {type}
                  </Badge>
                  <Badge variant='outline' size='sx'>
                    {key}
                  </Badge>
                  <Badge hidden={!isCurrent} variant='outline' colorScheme='yellow' size='sx'>
                    self
                  </Badge>
                  {name}
                </td>
                <td className={style.actionButtons}>
                  <Button
                    size='xs'
                    className={`${identify ? style.blink : ''}`}
                    isDisabled={disableIdentify}
                    variant={identify ? 'ontime-filled' : 'ontime-subtle'}
                    data-testid={isCurrent ? '' : 'not-self-identify'}
                    onClick={() => {
                      setIdentify({ target: key, state: !identify });
                    }}
                  >
                    Identify
                  </Button>
                  <Button
                    size='xs'
                    variant='ontime-subtle'
                    isDisabled={disableRename}
                    data-testid={isCurrent ? '' : 'not-self-rename'}
                    onClick={() => openRename(key)}
                  >
                    Rename
                  </Button>

                  <Button
                    size='xs'
                    variant='ontime-subtle'
                    isDisabled={disableRedirect}
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
    </>
  );
}

const selectColorScheme: Record<ClientTypes, string> = {
  [ClientTypes.Ontime]: 'blue',
  [ClientTypes.Unknown]: 'gray',
  [ClientTypes.Companion]: 'red',
  [ClientTypes.Chataigne]: 'orange',
};
