import { useRef, useState } from 'react';
import { Button, Textarea } from '@chakra-ui/react';
import { OntimeEvent } from 'ontime-types';

import { useEventAction } from '../../../common/hooks/useEventAction';
import type { PartialEdit } from '../Operator';

import style from './EditModal.module.scss';

interface EditModalProps {
  event: PartialEdit;
  onClose: () => void;
}

export default function EditModal(props: EditModalProps) {
  const { event, onClose } = props;

  const { updateEvent } = useEventAction();
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSave = async () => {
    setLoading(true);
    const newValue = inputRef.current?.value;

    const partialEvent: Partial<OntimeEvent> = {
      id: event.id,
      [event.field]: newValue,
    };
    await updateEvent(partialEvent);
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
