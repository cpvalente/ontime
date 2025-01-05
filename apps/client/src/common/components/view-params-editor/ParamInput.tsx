import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createListCollection, Input } from '@chakra-ui/react';

import { InputGroup } from '../../../components/ui/input-group';
import { NativeSelectField, NativeSelectRoot } from '../../../components/ui/native-select';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { isStringBoolean } from '../../../features/viewers/common/viewUtils';

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
    <>
      <input name={id} hidden readOnly value={paramState} />
      <SelectRoot
        multiple
        collection={options}
        fontWeight={400}
        lazyMount
        value={paramState}
        onValueChange={({ value }) => setParamState(value)}
      >
        <SelectTrigger>
          <SelectValueText placeholder={defaultValue ?? 'Select an option'} />
        </SelectTrigger>
        <SelectContent width='fit-content'>
          {options.items.map((option) => {
            return (
              <SelectItem item={option} key={option.value}>
                {option.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </SelectRoot>
    </>
  );
}
