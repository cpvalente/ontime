import { useRef, useState } from 'react';
import { Button, Textarea } from '@chakra-ui/react';

import { useEventAction } from '../../../common/hooks/useEventAction';
import type { PartialEdit } from '../Operator';

import style from './EditModal.module.scss';

interface EditModalProps {
  event: PartialEdit;
  onClose: () => void;
}

export default function EditModal(props: EditModalProps) {
  const { event, onClose } = props;

  const { updateCustomField } = useEventAction();
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSave = async () => {
    setLoading(true);
    const newValue = inputRef.current?.value;
    if (newValue === undefined) {
      return;
    }

    await updateCustomField(event.id, event.field, newValue);
    setLoading(false);
    onClose();
  };

  const fieldLabel = event?.fieldLabel ?? event.field;

  return (
    <div className={style.editModal}>
      <div>{`Editing field ${fieldLabel} in cue ${event.cue}`}</div>
      <Textarea
        ref={inputRef}
        variant='ontime-filled'
        placeholder={`Add value for ${fieldLabel} field`}
        defaultValue={event.fieldValue}
        isDisabled={loading}
        resize='none'
      />
      <div className={style.buttonRow}>
        <Button variant='ontime-subtle' onClick={onClose} isDisabled={loading}>
          Cancel
        </Button>
        <Button variant='ontime-filled' onClick={handleSave} isDisabled={loading}>
          Save
        </Button>
      </div>
    </div>
  );
}
