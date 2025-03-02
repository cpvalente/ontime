import { memo } from 'react';
import { Input } from '@chakra-ui/react';

import style from './EditableImage.module.scss';

interface EditableImageProps {
  initialValue: string;
  updateValue: (newValue: string) => void;
}

export default memo(EditableImage);

function EditableImage(props: EditableImageProps) {
  const { initialValue, updateValue } = props;

  const handleUpdate = (newValue: string) => {
    if (newValue === initialValue) {
      return;
    }
    if (newValue !== '' && !newValue.startsWith('http')) {
      return;
    }
    updateValue(newValue);
  };

  if (!initialValue) {
    return (
      <Input
        size='sm'
        variant='ontime-transparent'
        padding={0}
        fontSize='md'
        placeholder='Paste image URL'
        onBlur={(event) => handleUpdate(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            handleUpdate(event.currentTarget.value);
          }
        }}
        defaultValue={initialValue}
        spellCheck={false}
        autoComplete='off'
      />
    );
  }

  return (
    <div className={style.imageCell}>
      <div className={style.overlay}>
        <button onClick={() => handleUpdate('')}>Delete</button>
      </div>
      <img loading='lazy' src={initialValue} className={style.image} />
    </div>
  );
}
