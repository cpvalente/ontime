import { useSearchParams } from 'react-router-dom';
import { Input, Select, Switch } from '@chakra-ui/react';

import { isStringBoolean } from '../../utils/viewUtils';

import { ParamField } from './types';

interface EditFormInputProps {
  paramField: ParamField;
}

export default function ParamInput({ paramField }: EditFormInputProps) {
  const [searchParams] = useSearchParams();
  const { id, type, defaultValue } = paramField;

  if (type === 'option') {
    const optionFromParams = searchParams.get(id);
    const defaultOptionValue = optionFromParams || defaultValue;

    return (
      <Select
        placeholder={defaultValue ? undefined : 'Select an option'}
        variant='ontime'
        name={id}
        defaultValue={defaultOptionValue}
      >
        {Object.entries(paramField.values).map(([key, value]) => (
          <option key={key} value={key}>
            {value}
          </option>
        ))}
      </Select>
    );
  }

  if (type === 'boolean') {
    const defaultCheckedValue = isStringBoolean(searchParams.get(id)) ?? defaultValue;

    // checked value should be 'true', so it can be captured by the form event
    return <Switch variant='ontime' name={id} defaultChecked={defaultCheckedValue} value='true' />;
  }

  if (type === 'number') {
    const defaultNumberValue = searchParams.get(id) ?? defaultValue;

    return <Input type='number' step='any' variant='ontime-filled' name={id} defaultValue={defaultNumberValue} />;
  }

  const defaultStringValue = searchParams.get(id) ?? defaultValue;

  return <Input variant='ontime-filled' name={id} defaultValue={defaultStringValue} />;
}
