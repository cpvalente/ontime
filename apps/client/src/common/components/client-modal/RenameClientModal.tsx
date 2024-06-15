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

import { setClientRemote } from '../../hooks/useSocket';

import style from './ClientModal.module.scss';

interface RenameClientModalProps {
  id: string;
  name?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RenameClientModal(props: RenameClientModalProps) {
  const { id, name: currentName = '', isOpen, onClose } = props;
  const [name, setName] = useState(currentName);

  const { setClientName } = setClientRemote;

  const handleRename = () => {
    if (name !== currentName && name !== '') {
      setClientName({ target: id, rename: name });
    }
    onClose();
  };

  const canSubmit = name !== currentName && name !== '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Rename: {currentName}</ModalHeader>
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
            <Button size='md' variant='ontime-filled' onClick={handleRename} isDisabled={!canSubmit}>
              Submit
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
