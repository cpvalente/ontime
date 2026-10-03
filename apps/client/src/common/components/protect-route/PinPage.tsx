import { PropsWithChildren, useState } from 'react';

import { cx } from '../../utils/styleUtils';
import Button from '../buttons/Button';
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
      <form
        onSubmit={(event) => {
          event.preventDefault();
          validate();
        }}
        className={style.card}
      >
        <img src='ontime-logo.png' alt='' className={style.logo} />
        <h1 className={style.title}>{`Ontime ${permission}`}</h1>
        <p className={style.subtitle}>{`Enter the PIN to access the ${permission}`}</p>
        <Input
          type='password'
          maxLength={4}
          height='large'
          fluid
          autoFocus
          aria-label='PIN'
          aria-invalid={failed}
          aria-describedby='pin-error'
          placeholder='••••'
          value={pin}
          onChange={(e) => handleInputChange(e.target.value)}
          className={cx([style.pin, failed && style.pinFailed])}
        />
        {failed && (
          <p id='pin-error' role='alert' className={style.error}>
            Incorrect PIN, please try again
          </p>
        )}
        <Button
          type='submit'
          variant='primary'
          size='xlarge'
          fluid
          disabled={pin.length === 0}
          className={style.submit}
        >
          Unlock
        </Button>
      </form>
    </div>
  );
}
