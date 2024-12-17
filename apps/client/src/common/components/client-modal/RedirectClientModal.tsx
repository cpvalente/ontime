import { useState } from 'react';
import {
  Button,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  Input,
} from '@chakra-ui/react';

import { InputGroup } from '../../../components/ui/input-group';
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
    <DialogRoot isOpen={isOpen} onClose={onClose} variant='ontime'>
      {/* <ModalOverlay /> */}
      <DialogContent>
        <DialogHeader>Redirect: {name}</DialogHeader>
        <DialogCloseTrigger />
        <DialogBody>
          <InputGroup variant='ontime-filled' size='md' startElement={host}>
            <Input placeholder='minimal?key=0000ffff' value={path} onChange={(event) => setPath(event.target.value)} />
          </InputGroup>
        </DialogBody>
        <DialogFooter>
          <Button size='md' variant='ontime-subtle' onClick={onClose}>
            Cancel
          </Button>
          <Button size='md' variant='ontime-filled' onClick={handleRedirect} isDisabled={!canSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
