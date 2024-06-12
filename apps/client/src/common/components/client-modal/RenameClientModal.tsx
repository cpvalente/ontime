import { useState } from 'react';
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
import { ClientList } from 'ontime-types';

import style from './ClientModal.module.scss';

interface RenameClientModalProps {
  onClose: () => void;
  isOpen: boolean;
  id: string;
  clients: ClientList;
  onSubmit: (path: string) => void;
}

export function RenameClientModal(props: RenameClientModalProps) {
  const { onClose, isOpen, id, clients, onSubmit } = props;
  const [name, setName] = useState(clients[id].name);

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Rename: {clients[id].name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
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
