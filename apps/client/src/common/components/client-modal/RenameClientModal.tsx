import { useState } from 'react';
import { Input, Portal } from '@chakra-ui/react';

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
    <Portal>
      <DialogRoot open={isOpen} onOpenChange={onClose}>
        <DialogBackdrop />
        <DialogContent>
          <DialogHeader>Rename: {currentName}</DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            <Input
              variant='ontime-filled'
              size='md'
              placeholder='new name'
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </DialogBody>
          <DialogFooter>
            <Button size='md' variant='ontime-subtle' onClick={onClose}>
              Cancel
            </Button>
            <Button size='md' variant='ontime-filled' onClick={handleRename} disabled={!canSubmit}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Portal>
  );
}
