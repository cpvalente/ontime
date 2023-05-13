import { useCallback, useEffect, useState } from 'react';
import { HStack, IconButton, PinInput, PinInputField } from '@chakra-ui/react';
import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';

import style from './ProtectRoute.module.scss';

interface PinPageProps {
  permission: 'editor' | 'operator';
  handleValidation: (pin: string) => boolean;
}

export default function PinPage(props: PinPageProps) {
  const { permission, handleValidation } = props;
  const [pin, setPin] = useState('');
  const [failed, setFailed] = useState(false);

  const validate = useCallback(() => {
    const isValid = handleValidation(pin);
    if (!isValid) {
      setFailed(true);
      setPin('');
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
      {`Ontime ${permission || ''}`}
      <HStack spacing='10px' className={failed ? style.pin__failed : style.pin}>
        <PinInput
          type='alphanumeric'
          size='lg'
          mask
          autoFocus
          value={pin}
          onChange={(value) => {
            setFailed(false);
            setPin(value);
          }}
        >
          <PinInputField />
          <PinInputField />
          <PinInputField />
          <PinInputField />
        </PinInput>
        <IconButton aria-label='Enter' size='lg' isRound icon={<IoCheckmark />} onClick={validate} />
      </HStack>
    </div>
  );
}
