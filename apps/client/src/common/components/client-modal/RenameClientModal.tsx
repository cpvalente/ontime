import { useEffect, useState } from 'react';
import {
  Button,
  Input,
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

export function RenameClientModal(props: {
  onClose: () => void;
  isOpen: boolean;
  id: string;
  clients: Clients;
  onSubmit: (path: string) => void;
}) {
  const { onClose, isOpen, id, clients, onSubmit } = props;
  const [name, setName] = useState('');
  useEffect(() => {
    if (clients[id]?.name) setName(clients[id].name);
  }, [clients, id]);

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
