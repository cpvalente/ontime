import { Settings } from 'ontime-types';
import { regex } from 'ontime-utils';
import { PropsWithChildren, useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { IoEyeOutline } from 'react-icons/io5';

import IconButton from '../../../../../common/components/buttons/IconButton';
import Input from '../../../../../common/components/input/input/Input';

import style from './GeneralPinInput.module.scss';

type PinFields = Pick<Settings, 'editorKey' | 'operatorKey'>;

interface GeneralPinInputProps {
  register: UseFormRegister<PinFields>;
  formName: keyof PinFields;
  disabled?: boolean;
}

export default function GeneralPinInput({ register, formName, disabled }: PropsWithChildren<GeneralPinInputProps>) {
  const [isVisible, setVisible] = useState(false);

  return (
    <div className={style.container}>
      <Input
        type={isVisible ? 'text' : 'password'}
        maxLength={4}
        {...register(formName, {
          pattern: {
            value: regex.isAlphanumericOrEmpty,
            message: 'Only alphanumeric characters are allowed',
          },
        })}
        placeholder='-'
        disabled={disabled}
      />
      <IconButton
        onMouseDown={() => setVisible(true)}
        onMouseUp={() => setVisible(false)}
        variant='ghosted'
        aria-label='Show pin code'
      >
        <IoEyeOutline />
      </IconButton>
    </div>
  );
}
