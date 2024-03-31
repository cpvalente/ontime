import { PropsWithChildren, useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { IconButton, Input, InputGroup, InputRightElement } from '@chakra-ui/react';
import { IoEyeOutline } from '@react-icons/all-files/io5/IoEyeOutline';
import { Settings } from 'ontime-types';

interface GeneralPinInputProps {
  register: UseFormRegister<Settings>;
  formName: keyof Settings;
  isDisabled?: boolean;
}

export default function GeneralPinInput(props: PropsWithChildren<GeneralPinInputProps>) {
  const { register, formName, isDisabled } = props;
  const [isVisible, setVisible] = useState(false);

  return (
    <InputGroup size='sm' width='100px'>
      <Input
        variant='ontime-filled'
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
          variant='ontime-ghosted'
          icon={<IoEyeOutline />}
          aria-label='Show pin code'
        />
      </InputRightElement>
    </InputGroup>
  );
}
