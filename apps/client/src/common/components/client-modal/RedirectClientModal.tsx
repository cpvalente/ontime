import { useState } from 'react';
import { Input } from '@chakra-ui/react';

import { setClientRemote } from '../../hooks/useSocket';
import { Button } from '../ui/button';
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from '../ui/dialog';
import { InputGroup } from '../ui/input-group';

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
    <DialogRoot open={isOpen} onOpenChange={onClose}>
      <DialogBackdrop />
      <DialogContent>
        <DialogHeader>Redirect: {name}</DialogHeader>
        <DialogCloseTrigger />
        <DialogBody>
          <InputGroup startElement={host}>
            <Input
              placeholder='minimal?key=0000ffff'
              variant='ontime-filled'
              size='md'
              value={path}
              onChange={(event) => setPath(event.target.value)}
            />
          </InputGroup>
        </DialogBody>
        <DialogFooter>
          <Button size='md' variant='ontime-subtle' onClick={onClose}>
            Cancel
          </Button>
          <Button size='md' variant='ontime-filled' onClick={handleRedirect} disabled={!canSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
