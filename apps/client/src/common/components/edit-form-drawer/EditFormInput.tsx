import { useSearchParams } from 'react-router-dom';
import { Input, Select, Switch } from '@chakra-ui/react';

import { isStringBoolean } from '../../../common/utils/viewUtils';

import { ParamField } from './types';

interface EditFormInputProps {
  paramField: ParamField;
}

export default function EditFormInput({ paramField }: EditFormInputProps) {
  const [searchParams] = useSearchParams();
  const { id, type } = paramField;

  if (type === 'option') {
    const optionFromParams = searchParams.get(id);
    const defaultOptionValue = paramField.values.find((value) => value === optionFromParams);

    return (
      <Select placeholder='Select an option' variant='ontime' name={id} defaultValue={defaultOptionValue}>
        {paramField.values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </Select>
    );
  }

  if (type === 'boolean') {
    const defaultCheckedValue = isStringBoolean(searchParams.get(id)) ?? false;

    // checked value should be 'true', so it can be captured by the form event
    return <Switch variant='ontime' name={id} defaultChecked={defaultCheckedValue} value='true' />;
  }

  if (type === 'number') {
    const defaultNumberValue = searchParams.get(id) ?? '';

    return <Input type='number' variant='ontime-filled' name={id} defaultValue={defaultNumberValue} />;
  }

  const defaultStringValue = searchParams.get(id) ?? '';

  return <Input variant='ontime-filled' name={id} defaultValue={defaultStringValue} />;
}
