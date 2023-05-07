import { useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { IconButton, Input } from '@chakra-ui/react';
import { IoEyeOutline } from '@react-icons/all-files/io5/IoEyeOutline';

import style from './SettingsModal.module.scss';

interface ModalPinInputProps {
  register: UseFormRegister<any>;
  formName: string;
  isDisabled?: boolean;
}

export default function ModalPinInput({ register, formName, isDisabled }: ModalPinInputProps) {
  const [isVisible, setVisible] = useState(false);
  return (
    <div className={style.pin}>
      <Input
        type={isVisible ? 'text' : 'password'}
        width='75px'
        size='sm'
        textAlign='right'
        maxLength={4}
        {...register(formName)}
        placeholder='-'
        isDisabled={isDisabled}
      />
      <IconButton
        onMouseDown={() => setVisible(true)}
        onMouseUp={() => setVisible(false)}
        size='sm'
        variant='ghost'
        icon={<IoEyeOutline />}
        aria-label='Show pin code'
        isDisabled={false}
      />
    </div>
  );
}
