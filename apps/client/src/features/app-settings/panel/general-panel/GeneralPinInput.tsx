import { FormControl, IconButton, Input, InputGroup, InputRightElement } from '@chakra-ui/react';
import { PropsWithChildren, useState } from 'react';

import style from './GeneralPanel.module.scss';
import { UseFormRegister } from 'react-hook-form';
import { IoEyeOutline } from '@react-icons/all-files/io5/IoEyeOutline';

interface FormInput {
  [key: string]: string;
}

interface GeneralPinInputProps {
  register: UseFormRegister<FormInput>;
  formName: string;
  isDisabled?: boolean;
}

export default function GeneralPinInput(props: PropsWithChildren<GeneralPinInputProps>) {
  const [isVisible, setVisible] = useState(false);
  const { register, formName, isDisabled } = props;
  return (
    <InputGroup size='sm' width='100px'>
      <Input
        type={isVisible ? 'text' : 'password'}
        maxLength={4}
        {...register(formName)}
        placeholder='-'
        isDisabled={isDisabled}
      />
      <InputRightElement>
        <IconButton
          onMouseDown={() => setVisible(true)}
          onMouseUp={() => setVisible(false)}
          size='sm'
          variant='ontime-ghost-on-light'
          icon={<IoEyeOutline />}
          aria-label='Show pin code'
        />
      </InputRightElement>
    </InputGroup>
  );
}
