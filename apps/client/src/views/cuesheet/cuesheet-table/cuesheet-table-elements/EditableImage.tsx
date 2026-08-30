import { memo, useState } from 'react';

import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import { getRememberedAspectRatio, rememberAspectRatio } from '../../../../common/utils/imageDimensions';

import style from './EditableImage.module.scss';

interface EditableImageProps {
  initialValue: string;
  fieldLabel: string;
  readOnly?: boolean;
  updateValue: (newValue: string) => void;
}

export default memo(EditableImage);

/**
 * Images are referenced by link: anything local to the machine running ontime
 * would not resolve for the clients we serve the cuesheet to
 */
export function isValidImageSource(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function EditableImage({ initialValue, fieldLabel, readOnly, updateValue }: EditableImageProps) {
  const [isRejected, setIsRejected] = useState(false);
  /** we keep track of the source itself, so that the state follows the value being shown */
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);

  const handleUpdate = (newValue: string) => {
    const value = newValue.trim();

    if (value === initialValue) {
      setIsRejected(false);
      return;
    }

    if (value !== '' && !isValidImageSource(value)) {
      setIsRejected(true);
      return;
    }

    setIsRejected(false);
    updateValue(value);
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
      <>
        <Input
          variant='ghosted'
          className={style.imageInput}
          fluid
          placeholder='Paste image URL'
          data-invalid={isRejected || undefined}
          onChange={() => setIsRejected(false)}
          onBlur={(event) => handleUpdate(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleUpdate(event.currentTarget.value);
            }
          }}
        />
        {isRejected && <span className={style.message}>Images are referenced by link (https://...)</span>}
      </>
    );
  }

  /**
   * The cuesheet is virtualised: rows are unmounted once they leave the viewport.
   * When the row comes back, we reserve the space the image took
   * so that the table does not shift while the browser makes it available.
   */
  const knownAspectRatio = getRememberedAspectRatio(initialValue);
  const isLoaded = loadedSource === initialValue;

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
      {failedSource === initialValue ? (
        <span className={style.message}>Could not load image</span>
      ) : (
        <img
          src={initialValue}
          alt={fieldLabel}
          className={style.image}
          onLoad={(event) => {
            rememberAspectRatio(initialValue, event.currentTarget);
            setLoadedSource(initialValue);
          }}
          onError={() => setFailedSource(initialValue)}
          /** until the image is available, we reserve the space it took the last time we saw it */
          style={!isLoaded && knownAspectRatio !== null ? { aspectRatio: knownAspectRatio, width: '100%' } : undefined}
        />
      )}
    </div>
  );
}
