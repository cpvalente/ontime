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

import { setClientRemote } from '../../../../common/hooks/useSocket';
import { useClientStore } from '../../../../common/stores/clientStore';
import * as Panel from '../PanelUtils';

import style from './ClientControlPanel.module.scss';

export default function ClientList() {
  const { id: myId, clients } = useClientStore();
  const { isOpen: isOpenRedirect, onOpen: onOpenRedirect, onClose: onCloseRedirect } = useDisclosure();
  const { isOpen: isOpenRename, onOpen: onOpenRename, onClose: onCloseRename } = useDisclosure();
  const { setIdentify, setRedirect, setRename } = setClientRemote;

  const [targetName, setTargetName] = useState('');

  const openRename = (clientName: string) => {
    setTargetName(clientName);
    onOpenRename();
  };

  const rename = (name: string) => {
    setRename({ target: targetName, name });
    onCloseRename();
  };

  const openRedirect = (clientName: string) => {
    setTargetName(clientName);
    onOpenRedirect();
  };

  const redirect = (path: string) => {
    setRedirect({ target: targetName, path });
    onCloseRedirect();
  };

  return (
    <>
      <RedirectModal onClose={onCloseRedirect} isOpen={isOpenRedirect} clientName={targetName} onSubmit={redirect} />
      <RenameModal onClose={onCloseRename} isOpen={isOpenRename} clientName={targetName} onSubmit={rename} />
      <Panel.Table>
        <thead>
          <tr>
            <td className={style.fullWidth}>Client Name (Tab id)</td>
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
                <td className={style.fullWidth}>
                  {name}
                  <Badge variant='outline' size='sx'>
                    {id}
                  </Badge>
                  <Badge hidden={!isCurrent} variant='outline' colorScheme='yellow' size='sx'>
                    self
                  </Badge>
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
                  <Button size='xs' variant='ontime-subtle' isDisabled={isCurrent} onClick={() => openRename(id)}>
                    Rename
                  </Button>

                  <ButtonGroup size='xs' isAttached variant='ontime-subtle'>
                    <Button isLoading={isRedirecting} isDisabled={isCurrent} onClick={() => openRedirect(id)}>
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
  clientName: string;
  onSubmit: (path: string) => void;
}) {
  const { onClose, isOpen, clientName, onSubmit } = props;
  const [path, setPath] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Redirect Client</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <div>Redirect {clientName} to a new URL</div>
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
  clientName: string;
  onSubmit: (path: string) => void;
}) {
  const { onClose, isOpen, clientName, onSubmit } = props;
  const [path, setPath] = useState(clientName);

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Rename Client</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <div>Rename {clientName}</div>
          <Input
            variant='ontime-filled'
            size='md'
            placeholder='new name'
            value={path}
            onChange={(event) => setPath(event.target.value)}
          />
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
