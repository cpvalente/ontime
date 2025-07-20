import { PropsWithChildren, useState } from 'react';
import { IoCheckmark } from 'react-icons/io5';

import { cx } from '../../utils/styleUtils';
import IconButton from '../buttons/IconButton';
import Input from '../input/input/Input';

import style from './PinPage.module.scss';

interface PinPageProps {
  permission: 'editor' | 'operator';
  handleValidation: (pin: string) => boolean;
}

export default function PinPage({ permission, handleValidation }: PropsWithChildren<PinPageProps>) {
  const [pin, setPin] = useState('');
  const [failed, setFailed] = useState(false);

  const validate = () => {
    const isValid = handleValidation(pin);
    if (!isValid) {
      setFailed(true);
      setPin('');
    }
  };

  const handleInputChange = (value: string) => {
    setPin(value);
    if (failed) setFailed(false);
  };

  return (
    <div className={style.container}>
      {`Ontime ${permission}`}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          validate();
        }}
        className={cx([style.pin, failed && style.pinFailed])}
      >
        <Input
          type='password'
          maxLength={4}
          height='large'
          value={pin}
          onChange={(e) => handleInputChange(e.target.value)}
        />
        <IconButton type='submit' variant='primary' aria-label='Enter'>
          <IoCheckmark />
        </IconButton>
      </form>
    </div>
  );
}
