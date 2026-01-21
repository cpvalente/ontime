import { Fragment, useRef, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { Dialog } from '@base-ui/react/dialog';
import { OntimeEvent } from 'ontime-types';

import Button from '../../../common/components/buttons/Button';
import IconButton from '../../../common/components/buttons/IconButton';
import Textarea from '../../../common/components/input/textarea/Textarea';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { EditEvent } from '../operator.types';

import style from './CustomFieldEditModal.module.scss';

interface CustomFieldEditModalProps {
  event: EditEvent;
  onClose: () => void;
}

export default function CustomFieldEditModal(props: CustomFieldEditModalProps) {
  const { event, onClose } = props;

  const { updateEntry } = useEntryActions();
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
      await updateEntry(patchObject);
    }

    setLoading(false);
    onClose();
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Popup className={style.editModal}>
          <div className={style.title}>
            {`Editing fields in cue ${event.cue}`}
            <IconButton variant='subtle-white' onClick={onClose} disabled={loading}>
              <IoClose />
            </IconButton>
          </div>
          <div className={style.body}>
            {event.subscriptions.map((field) => {
              return (
                <Fragment key={field.id}>
                  <label htmlFor={field.id} className={style.label} style={{ '--user-bg': field.colour }}>
                    {field.label}
                  </label>
                  <Textarea
                    name={field.id}
                    ref={(element) => {
                      if (element) inputRef.current.push(element);
                    }}
                    placeholder={`Add value for ${field.label} field`}
                    defaultValue={field.value}
                    data-field={field.id}
                    disabled={loading}
                    rows={5}
                  />
                </Fragment>
              );
            })}
          </div>

          <div className={style.footer}>
            <Button variant='subtle' size='large' onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant='primary' size='large' onClick={handleSave} disabled={loading}>
              Save
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
