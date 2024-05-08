import { useState } from 'react';
import {
  Button,
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
} from '@chakra-ui/react';
import { Clients } from 'ontime-types';

import style from './ClientControlPanel.module.scss';

export function RedirectModal(props: {
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

export function RenameModal(props: {
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
