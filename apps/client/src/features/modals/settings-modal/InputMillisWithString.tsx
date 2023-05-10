import { useController, UseControllerProps } from 'react-hook-form';
import { Input } from '@chakra-ui/react';
import { ViewSettings } from 'ontime-types';

import { millisToMinutes } from '../../../common/utils/dateConfig';
import { inputProps } from '../modalHelper';

export default function InputMillisWithString(props: UseControllerProps<ViewSettings>) {
  const { name, control } = props;
  const {
    field: { onChange, value },
  } = useController({
    control,
    name,
    rules: {
      pattern: {
        value: /^[0-9]+$/,
        message: 'Only numbers are valid',
      },
    },
  });

  return (
    <Input
      {...inputProps}
      type='number'
      variant='ontime-filled-on-light'
      width='75px'
      size='sm'
      maxLength={3}
      defaultValue={millisToMinutes(value as number)}
      onChange={onChange}
    />
  );
}
