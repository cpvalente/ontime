import { useRef, useState } from 'react';
import { Button, Textarea } from '@chakra-ui/react';

import { useEventAction } from '../../../common/hooks/useEventAction';
import type { EditEvent } from '../Operator';

import style from './EditModal.module.scss';

interface EditModalProps {
  event: EditEvent;
  onClose: () => void;
}

export default function EditModal(props: EditModalProps) {
  const { event, onClose } = props;

  const { updateCustomField } = useEventAction();
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement[]>(new Array<HTMLTextAreaElement>());

  const handleSave = async () => {
    setLoading(true);
    inputRef.current?.forEach(async (element) => {
      if (element.dataset.field && element.defaultValue != element.value) {
        await updateCustomField(event.id, element.dataset.field, element.value);
      }
    });

    setLoading(false);
    onClose();
  };

  return (
    <div className={style.editModal}>
      <div>{`Editing fields in cue ${event.cue}`}</div>
      {event.subscriptions.map((field) => {
        return (
          <div key={field.label}>
            <label>{field.label}</label>
            <Textarea
              ref={(element) => {
                if (element) inputRef.current.push(element);
              }}
              variant='ontime-filled'
              placeholder={`Add value for ${field.label} field`}
              defaultValue={field.value}
              data-field={field.id}
              isDisabled={loading}
              resize='none'
            />
          </div>
        );
      })}
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
