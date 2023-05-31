import { useSearchParams } from 'react-router-dom';
import { Input, Select, Switch } from '@chakra-ui/react';

import { Field } from './types';

interface EditFormInputProps {
  field: Field;
}

export default function EditFormInput({ field }: EditFormInputProps) {
  const [searchParams] = useSearchParams();
  const { id, type } = field;

  if (type === 'option') {
    const optionFromParams = searchParams.get(id);
    const defaultOptionValue = field.values.find((value) => value === optionFromParams);

    return (
      <Select placeholder='Select an option' variant='ontime' name={id} defaultValue={defaultOptionValue}>
        {field.values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </Select>
    );
  }

  if (type === 'boolean') {
    const defaultCheckedValue = searchParams.get(id) === 'true' ?? false;

    return <Switch variant='ontime' name={id} defaultChecked={defaultCheckedValue} />;
  }

  if (type === 'number') {
    const defaultNumberValue = searchParams.get(id) ?? '';

    return <Input type='number' variant='ontime-filled' name={id} defaultValue={defaultNumberValue} />;
  }

  const defaultStringValue = searchParams.get(id) ?? '';

  return <Input variant='ontime-filled' name={id} defaultValue={defaultStringValue} />;
}
