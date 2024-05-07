import { useState } from 'react';
import {
  Badge,
  Button,
  ButtonGroup,
  IconButton,
  Input,
  InputGroup,
  InputLeftAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { Clients } from 'ontime-types';

import { setClientRemote } from '../../../../common/hooks/useSocket';
import { useClientStore } from '../../../../common/stores/clientStore';
import * as Panel from '../PanelUtils';

import style from './ClientControlPanel.module.scss';

export default function ClientList() {
  const { id: myId, clients } = useClientStore();
  const { isOpen: isOpenRedirect, onOpen: onOpenRedirect, onClose: onCloseRedirect } = useDisclosure();
  const { isOpen: isOpenRename, onOpen: onOpenRename, onClose: onCloseRename } = useDisclosure();
  const { setIdentify, setRedirect, setRename } = setClientRemote;

  const [targetId, setTargetId] = useState('');

  const openRename = (id: string) => {
    setTargetId(id);
    onOpenRename();
  };

  const rename = (name: string) => {
    setRename({ target: targetId, name });
    onCloseRename();
  };

  const openRedirect = (id: string) => {
    setTargetId(id);
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
          {Object.entries(clients).map(([id, client]) => {
            const { identify, redirect, name } = client;
            const isCurrent = id === myId;
            const isRedirecting = redirect != '';
            return (
              <tr key={id} className={isCurrent ? style.current : undefined}>
                <td className={style.badgeList}>
                  <Badge variant='outline' size='sx'>
                    {id}
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
                    variant={identify ? 'ontime-filled' : 'ontime-subtle'}
                    onClick={() => {
                      setIdentify({ target: id, state: !identify });
                    }}
                    isActive
                  >
                    Identify
                  </Button>
                  <Button size='xs' variant='ontime-subtle' onClick={() => openRename(id)}>
                    Rename
                  </Button>

                  <ButtonGroup size='xs' isAttached variant='ontime-subtle'>
                    <Button isLoading={isRedirecting} onClick={() => openRedirect(id)}>
                      Redirect
                    </Button>
                    {isRedirecting && (
                      <IconButton
                        aria-label='Cancel the redirect'
                        icon={<IoClose />}
                        onClick={() => setRedirect({ target: id, path: '' })}
                      />
                    )}
                  </ButtonGroup>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Panel.Table>
    </>
  );
}

function RedirectModal(props: {
  onClose: () => void;
  isOpen: boolean;
  id: string;
  clients: Clients;
  onSubmit: (path: string) => void;
}) {
  const { onClose, isOpen, id, clients, onSubmit } = props;
  const [path, setPath] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Redirect {clients[id]?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <div>Redirect to a new URL</div>
          <InputGroup variant='ontime-filled' size='md'>
            {/* TODO: better description */}
            <InputLeftAddon>ontime:port/</InputLeftAddon>
            <Input placeholder='newpath?and=params' value={path} onChange={(event) => setPath(event.target.value)} />
          </InputGroup>
        </ModalBody>
        <ModalFooter>
          <div className={style.buttonSection}>
            <Button size='md' variant='ontime-subtle' onClick={onClose}>
              Cancel
            </Button>
            <Button size='md' variant='ontime-filled' onClick={() => onSubmit(path)}>
              Submit
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function RenameModal(props: {
  onClose: () => void;
  isOpen: boolean;
  id: string;
  clients: Clients;
  onSubmit: (path: string) => void;
}) {
  const { onClose, isOpen, id, clients, onSubmit } = props;
  const [name, setName] = useState(clients[id]?.name ?? '');

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Rename {clients[id]?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <div>All connections in this client will have the same name after a reload</div>
          <Input
            variant='ontime-filled'
            size='md'
            placeholder='new name'
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <div className={style.buttonSection}>
            <Button size='md' variant='ontime-subtle' onClick={onClose}>
              Cancel
            </Button>
            <Button size='md' variant='ontime-filled' onClick={() => onSubmit(name)}>
              Submit
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
