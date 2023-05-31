import { Input, Select, Switch } from '@chakra-ui/react';

import { Field } from './types';

interface EditFormInputProps {
  field: Field;
}

export default function EditFormInput({ field }: EditFormInputProps) {
  if (field.type === 'option') {
    return (
      <Select placeholder='Select an option' variant='ontime'>
        {field.values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </Select>
    );
  }

  if (field.type === 'boolean') {
    return <Switch variant='ontime' />;
  }

  if (field.type === 'number') {
    return <Input type='number' variant='ontime-filled' />;
  }

  return <Input variant='ontime-filled' />;
}
