import { useCallback, useEffect, useState } from 'react';
import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';

import { IconButton } from '../ui/icon-button';
import { PinInput } from '../ui/pin-input';

import style from './ProtectRoute.module.scss';

const DEFAULT_PIN_VALUE = ['', '', '', ''];

interface PinPageProps {
  permission: 'editor' | 'operator';
  handleValidation: (pin: string) => boolean;
}

export default function PinPage(props: PinPageProps) {
  const { permission, handleValidation } = props;
  const [pin, setPin] = useState(DEFAULT_PIN_VALUE);
  const [failed, setFailed] = useState(false);

  const validate = useCallback(() => {
    const isValid = handleValidation(pin.join(''));
    if (!isValid) {
      setFailed(true);
      setPin(DEFAULT_PIN_VALUE);
    }
  }, [handleValidation, pin]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === 'Enter') {
        validate();
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [validate]);

  return (
    <div className={style.container}>
      {`Ontime ${permission}`}
      <div className={failed ? style.pin__failed : style.pin}>
        <PinInput
          type='alphanumeric'
          size='lg'
          mask
          autoFocus
          value={pin}
          onValueChange={({ value }) => {
            setFailed(false);
            setPin(value);
          }}
        />
        <IconButton variant='ontime-filled' aria-label='Enter' size='lg' rounded='full' onClick={validate}>
          <IoCheckmark />
        </IconButton>
      </div>
    </div>
  );
}
