import { useState } from 'react';
import {
  Button,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  Input,
} from '@chakra-ui/react';

import { setClientRemote } from '../../hooks/useSocket';

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
    <DialogRoot isOpen={isOpen} onClose={onClose} variant='ontime'>
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
          <Button size='md' variant='ontime-filled' onClick={handleRename} isDisabled={!canSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
