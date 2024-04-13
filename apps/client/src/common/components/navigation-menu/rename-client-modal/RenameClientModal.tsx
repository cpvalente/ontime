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
} from '@chakra-ui/react';

import { setClientName } from '../../../hooks/useSocket';
import { useSocketClientName } from '../../../stores/connectionName';

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
      isOpen={isOpen}
      onClose={onClose}
      size='sm'
      closeOnOverlayClick={false}
      motionPreset='slideInBottom'
      scrollBehavior='inside'
      preserveScrollBarGap
      variant='ontime'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Rename client</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input
            placeholder='Connection must have a name'
            defaultValue={newName}
            onChange={(e) => setNewName(e.target.value)}
            variant='ontime-filled'
          />
          <Button
            isDisabled={newName === clientName || !newName}
            onClick={handleRename}
            width='100%'
            variant='ontime-filled'
          >
            Save
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
