import { memo } from 'react';

import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';

import style from './EditableImage.module.scss';

interface EditableImageProps {
  initialValue: string;
  readOnly?: boolean;
  updateValue: (newValue: string) => void;
}

export default memo(EditableImage);

function EditableImage({ initialValue, readOnly, updateValue }: EditableImageProps) {
  const handleUpdate = (newValue: string) => {
    if (newValue === initialValue) {
      return;
    }
    if (newValue !== '' && !newValue.startsWith('http')) {
      return;
    }
    updateValue(newValue);
  };

  const openInNewTab = () => {
    if (initialValue) {
      window.open(initialValue, '_blank', 'noopener,noreferrer');
    }
  };

  if (!initialValue) {
    return (
      <Input
        variant='ghosted'
        className={style.imageInput}
        fluid
        readOnly={readOnly}
        // we disable the field to prevent receiving focus
        disabled={readOnly}
        placeholder='Paste image URL'
        onBlur={(event) => handleUpdate(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            handleUpdate(event.currentTarget.value);
          }
        }}
        defaultValue={initialValue}
      />
    );
  }

  return (
    <div className={style.imageCell}>
      {!readOnly && (
        <div className={style.overlay}>
          <Button onClick={openInNewTab}>Preview</Button>
          <Button variant='subtle-destructive' onClick={() => handleUpdate('')}>
            Delete
          </Button>
        </div>
      )}
      {Boolean(initialValue) && <img loading='lazy' src={initialValue} className={style.image} />}
    </div>
  );
}
