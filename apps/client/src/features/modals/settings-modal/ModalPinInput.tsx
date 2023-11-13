import { useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { IconButton, Input, InputGroup, InputRightElement } from '@chakra-ui/react';
import { IoEyeOutline } from '@react-icons/all-files/io5/IoEyeOutline';

interface FormInput {
  [key: string]: string;
}

interface ModalPinInputProps {
  register: UseFormRegister<FormInput>;
  formName: string;
  isDisabled?: boolean;
}

export default function ModalPinInput({ register, formName, isDisabled }: ModalPinInputProps) {
  const [isVisible, setVisible] = useState(false);
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
