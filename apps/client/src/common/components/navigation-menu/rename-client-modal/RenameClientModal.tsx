import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@mantine/core';

import { setClientName } from '../../../hooks/useSocket';
import { useSocketClientName } from '../../../stores/connectionName';

import style from './RenameClientModal.module.scss';

interface RenameClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RenameClientModal({ isOpen, onClose }: RenameClientModalProps) {
  const { name: clientName, persistName } = useSocketClientName();
  const [newName, setNewName] = useState(clientName);

  useEffect(() => {
    setNewName(clientName);
  }, [isOpen, clientName]);

  const handleRename = async () => {
    if (newName) {
      setClientName(newName);
      persistName(newName);
      onClose();
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size='sm'
      closeOnClickOutside={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Rename client</ModalHeader>
        <ModalCloseButton />
        <ModalBody className={style.modalBody}>
          <Input
            placeholder='Connection must have a name'
            defaultValue={newName}
            onChange={(e) => setNewName(e.target.value)}
            variant='ontime-filled-on-light'
          />
          <Button
            disabled={newName === clientName || !newName}
            onClick={handleRename}
            //width='100%'
            variant='ontime-filled'
          >
            Save
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
