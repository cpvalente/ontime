import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createListCollection, Input } from '@chakra-ui/react';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';
import { InputGroup } from '../ui/input-group';
import { NativeSelectField, NativeSelectRoot } from '../ui/native-select';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText } from '../ui/select';
import { Switch } from '../ui/switch';

import InlineColourPicker from './InlineColourPicker';
import { ParamField } from './types';

interface EditFormInputProps {
  paramField: ParamField;
}

export default function ParamInput(props: EditFormInputProps) {
  const { paramField } = props;
  const [searchParams] = useSearchParams();
  const { id, type, defaultValue } = paramField;

  if (type === 'persist') {
    return null;
  }

  if (type === 'option') {
    const optionFromParams = searchParams.get(id);
    const defaultOptionValue = optionFromParams || defaultValue;

    return (
      <NativeSelectRoot>
        <NativeSelectField
          name={id}
          defaultValue={defaultOptionValue}
          placeholder={defaultValue ? undefined : 'Select an option'}
        >
          {Object.entries(paramField.values).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>
    );
  }

  if (type === 'multi-option') {
    return <MultiOption paramField={paramField} />;
  }

  if (type === 'boolean') {
    const defaultCheckedValue = isStringBoolean(searchParams.get(id)) || defaultValue;

    // checked value should be 'true', so it can be captured by the form event
    return <Switch name={id} defaultChecked={defaultCheckedValue} value='true' />;
  }

  if (type === 'number') {
    const { prefix, placeholder } = paramField;
    const defaultNumberValue = searchParams.get(id) ?? defaultValue;

    return (
      <InputGroup startElement={prefix ?? null}>
        <Input
          type='number'
          step='any'
          variant='ontime-filled'
          name={id}
          defaultValue={defaultNumberValue}
          placeholder={placeholder}
        />
      </InputGroup>
    );
  }

  if (type === 'colour') {
    const currentvalue = `#${searchParams.get(id) ?? defaultValue}`;

    return <InlineColourPicker name={id} value={currentvalue} />;
  }

  const defaultStringValue = searchParams.get(id) ?? defaultValue;
  const { prefix, placeholder } = paramField;

  return (
    <InputGroup startElement={prefix ?? null}>
      <Input name={id} defaultValue={defaultStringValue} placeholder={placeholder} variant='ontime-filled' />
    </InputGroup>
  );
}

interface EditFormMultiOptionProps {
  paramField: ParamField & { type: 'multi-option' };
}

function MultiOption(props: EditFormMultiOptionProps) {
  const [searchParams] = useSearchParams();
  const { paramField } = props;
  const { id, defaultValue, values } = paramField;

  const optionFromParams = searchParams.getAll(id);
  const [paramState, setParamState] = useState<string[]>(optionFromParams || [defaultValue] || ['']);

  const options = createListCollection({ items: values });

  return (
    <SelectRoot
      name={id}
      multiple
      collection={options}
      value={paramState}
      onValueChange={({ value }) => setParamState(value)}
      lazyMount
      unmountOnExit
    >
      <SelectTrigger>
        <SelectValueText placeholder={defaultValue ?? 'Select an option'} />
      </SelectTrigger>
      <SelectContent>
        {options.items.map((option) => (
          <SelectItem item={option} key={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
