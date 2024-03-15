import { useSearchParams } from 'react-router-dom';
import { Input, NativeSelect, Switch } from '@mantine/core';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';

import { ParamField } from './types';

interface EditFormInputProps {
  paramField: ParamField;
}

export default function ParamInput(props: EditFormInputProps) {
  const [searchParams] = useSearchParams();
  const { paramField } = props;
  const { id, type, defaultValue } = paramField;

  if (type === 'option') {
    const optionFromParams = searchParams.get(id);
    const defaultOptionValue = optionFromParams || defaultValue;

    return (
      <NativeSelect
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
      </NativeSelect>
    );
  }

  if (type === 'boolean') {
    const defaultCheckedValue = isStringBoolean(searchParams.get(id)) || defaultValue;

    // checked value should be 'true', so it can be captured by the form event
    return <Switch variant='ontime' name={id} defaultChecked={defaultCheckedValue} value='true' />;
  }

  if (type === 'number') {
    const { prefix, placeholder } = paramField;
    const defaultNumberValue = searchParams.get(id) ?? defaultValue;

    return (
      <Input
        type='number'
        step='any'
        variant='ontime-filled'
        name={id}
        defaultValue={defaultNumberValue}
        placeholder={placeholder}
        leftSection={prefix}
      />
    );
  }

  const defaultStringValue = searchParams.get(id) ?? defaultValue;
  const { prefix, placeholder } = paramField;

  return <Input leftSection={prefix} name={id} defaultValue={defaultStringValue} placeholder={placeholder} />;
}
