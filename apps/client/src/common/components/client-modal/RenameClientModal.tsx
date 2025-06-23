import { useState } from 'react';

import Button from '../../../common/components/buttons/Button';
import { setClientRemote } from '../../hooks/useSocket';
import Dialog from '../dialog/Dialog';
import Input from '../input/input/Input';

interface RenameClientModalProps {
  id: string;
  name?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RenameClientModal({ id, name: currentName = '', isOpen, onClose }: RenameClientModalProps) {
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
    <Dialog
      isOpen={isOpen}
      title={`Rename Client: ${currentName}`}
      showCloseButton
      onClose={onClose}
      bodyElements={
        <Input height='large' placeholder='New name' value={name} onChange={(event) => setName(event.target.value)} />
      }
      footerElements={
        <>
          <Button variant='subtle' size='large' onClick={onClose}>
            Cancel
          </Button>
          <Button variant='primary' size='large' onClick={handleRename} disabled={!canSubmit}>
            Submit
          </Button>
        </>
      }
    />
  );
}
