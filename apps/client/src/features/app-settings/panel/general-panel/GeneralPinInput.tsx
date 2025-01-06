import { PropsWithChildren, useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { IconButton, Input } from '@chakra-ui/react';
import { IoEyeOutline } from '@react-icons/all-files/io5/IoEyeOutline';
import { Settings } from 'ontime-types';

import { InputGroup } from '../../../../common/components/ui/input-group';

interface GeneralPinInputProps {
  register: UseFormRegister<Settings>;
  formName: keyof Settings;
  isDisabled?: boolean;
}

export default function GeneralPinInput(props: PropsWithChildren<GeneralPinInputProps>) {
  const { register, formName, isDisabled } = props;
  const [isVisible, setVisible] = useState(false);

  return (
    <InputGroup
      width='100px'
      startElement={
        <IconButton
          onMouseDown={() => setVisible(true)}
          onMouseUp={() => setVisible(false)}
          size='sm'
          variant='ontime-ghosted'
          aria-label='Show pin code'
        >
          <IoEyeOutline />
        </IconButton>
      }
    >
      <Input
        variant='ontime-filled'
        type={isVisible ? 'text' : 'password'}
        maxLength={4}
        {...register(formName)}
        placeholder='-'
        disabled={isDisabled}
      />
    </InputGroup>
  );
}
