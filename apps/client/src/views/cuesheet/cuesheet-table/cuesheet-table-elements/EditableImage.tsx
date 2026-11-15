import { memo, useState } from 'react';

import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import { isImageUrl } from '../../../../common/utils/imageUrl';

import style from './EditableImage.module.scss';

interface EditableImageProps {
  initialValue: string;
  readOnly?: boolean;
  updateValue: (newValue: string) => void;
}

export default memo(EditableImage);

function EditableImage({ initialValue, readOnly, updateValue }: EditableImageProps) {
  // readers cannot fix a broken link, so its image is hidden from them
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

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
    // stored values are not validated, only open web links
    if (isImageUrl(initialValue)) {
      window.open(initialValue, '_blank', 'noopener,noreferrer');
    }
  };

  if (readOnly && (!initialValue || failedSrc === initialValue)) {
    return null;
  }

  if (!initialValue) {
    return (
      <Input
        variant='ghosted'
        className={style.imageInput}
        fluid
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
      {Boolean(initialValue) && (
        <img loading='lazy' src={initialValue} className={style.image} onError={() => setFailedSrc(initialValue)} />
      )}
    </div>
  );
}
