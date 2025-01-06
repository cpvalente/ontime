import { useRef, useState } from 'react';
import { Textarea } from '@chakra-ui/react';
import { OntimeEvent } from 'ontime-types';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { Button } from '../../../components/ui/button';
import type { EditEvent } from '../Operator';

import style from './EditModal.module.scss';

interface EditModalProps {
  event: EditEvent;
  onClose: () => void;
}

export default function EditModal(props: EditModalProps) {
  const { event, onClose } = props;

  const { updateEvent } = useEventAction();
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement[]>(new Array<HTMLTextAreaElement>());

  const handleSave = async () => {
    if (!inputRef.current) return;
    setLoading(true);

    const patchObject: Partial<OntimeEvent> = { id: event.id };

    inputRef.current.forEach((element) => {
      if (element.dataset.field && element.defaultValue != element.value) {
        if (patchObject.custom) {
          patchObject.custom[element.dataset.field] = element.value;
        } else {
          Object.assign(patchObject, { custom: { [element.dataset.field]: element.value } });
        }
      }
    });

    if (patchObject.custom) {
      await updateEvent(patchObject);
    }

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
              disabled={loading}
              resize='none'
            />
          </div>
        );
      })}
      <div className={style.buttonRow}>
        <Button variant='ontime-subtle' onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant='ontime-filled' onClick={handleSave} disabled={loading}>
          Save
        </Button>
      </div>
    </div>
  );
}
