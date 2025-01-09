import { useState } from 'react';
import { Group, Input, InputAddon } from '@chakra-ui/react';

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

import styles from './RedirectClientModal.module.scss';

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
          <Group gap={0} attached>
            <InputAddon className={styles.localhostInputAddon}>{host}</InputAddon>
            <Input
              placeholder='minimal?key=0000ffff'
              variant='ontime-filled'
              size='md'
              value={path}
              onChange={(event) => setPath(event.target.value)}
            />
          </Group>
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
