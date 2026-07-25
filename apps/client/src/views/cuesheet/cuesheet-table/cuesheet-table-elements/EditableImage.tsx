import { memo, useState } from 'react';

import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import { getRememberedAspectRatio, rememberAspectRatio } from '../../../../common/utils/imageDimensions';

import style from './EditableImage.module.scss';

interface EditableImageProps {
  initialValue: string;
  readOnly?: boolean;
  updateValue: (newValue: string) => void;
}

export default memo(EditableImage);

function EditableImage({ initialValue, readOnly, updateValue }: EditableImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  /**
   * The cuesheet is virtualised: rows are unmounted once they leave the viewport.
   * When the row comes back, we reserve the space the image took
   * so that the table does not shift while the browser makes it available.
   */
  const knownAspectRatio = getRememberedAspectRatio(initialValue);

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

  if (!initialValue && readOnly) {
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
      <img
        src={initialValue}
        alt=''
        className={style.image}
        onLoad={(event) => {
          rememberAspectRatio(initialValue, event.currentTarget);
          setIsLoaded(true);
        }}
        /** until the image is available, we reserve the space it took the last time we saw it */
        style={!isLoaded && knownAspectRatio !== null ? { aspectRatio: knownAspectRatio, width: '100%' } : undefined}
      />
    </div>
  );
}
