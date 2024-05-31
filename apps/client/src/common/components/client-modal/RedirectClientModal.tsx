import { useEffect, useState } from 'react';
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

import style from './ClientModal.module.scss';

interface RedirectClientModalProps {
  onClose: () => void;
  isOpen: boolean;
  id: string;
  clients: Clients;
  onSubmit: (path: string) => void;
}

export function RedirectClientModal(props: RedirectClientModalProps) {
  const { onClose, isOpen, id, clients, onSubmit } = props;
  const [path, setPath] = useState('');

  // when clientlist and id is populated get the relevant path to use a default value
  useEffect(() => {
    if (clients[id]?.path) setPath(clients[id].path);
  }, [clients, id]);

  const host = `${window.location.origin}/`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Redirect {clients[id]?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <InputGroup variant='ontime-filled' size='md'>
            <InputLeftAddon>{host}</InputLeftAddon>
            <Input placeholder='minimal?key=0000ffff' value={path} onChange={(event) => setPath(event.target.value)} />
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
