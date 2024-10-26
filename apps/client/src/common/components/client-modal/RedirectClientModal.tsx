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

import { setClientRemote } from '../../hooks/useSocket';

interface RedirectClientModalProps {
  id: string;
  name?: string;
  path?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RedirectClientModal(props: RedirectClientModalProps) {
  const { id, isOpen, name = '', path: currentPath = '', onClose } = props;
  const [path, setPath] = useState(currentPath);

  const { setRedirect } = setClientRemote;

  const handleRedirect = () => {
    if (path !== currentPath && path !== '') {
      setRedirect({ target: id, redirect: path });
    }
    onClose();
  };

  const host = window.location.origin;
  const canSubmit = path !== currentPath && path !== '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Redirect: {name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <InputGroup variant='ontime-filled' size='md'>
            <InputLeftAddon>{host}</InputLeftAddon>
            <Input placeholder='minimal?key=0000ffff' value={path} onChange={(event) => setPath(event.target.value)} />
          </InputGroup>
        </ModalBody>
        <ModalFooter>
          <Button size='md' variant='ontime-subtle' onClick={onClose}>
            Cancel
          </Button>
          <Button size='md' variant='ontime-filled' onClick={handleRedirect} isDisabled={!canSubmit}>
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
