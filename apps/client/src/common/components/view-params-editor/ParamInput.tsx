import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Input } from '@chakra-ui/react';
import { IoChevronDown } from '@react-icons/all-files/io5/IoChevronDown';

import { InputGroup } from '../../../components/ui/input-group';
import { MenuContent, MenuItem, MenuRadioItemGroup, MenuRoot, MenuTrigger } from '../../../components/ui/menu';
import { NativeSelectField, NativeSelectRoot } from '../../../components/ui/native-select';
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
      <NativeSelectRoot variant='ontime'>
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
    return <Switch variant='ontime' name={id} defaultChecked={defaultCheckedValue} value='true' />;
  }

  if (type === 'number') {
    const { prefix, placeholder } = paramField;
    const defaultNumberValue = searchParams.get(id) ?? defaultValue;

    return (
      <InputGroup variant='ontime-filled' startElement={prefix ?? null}>
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
    <InputGroup variant='ontime-filled' startElement={prefix ?? null}>
      <Input name={id} defaultValue={defaultStringValue} placeholder={placeholder} />
    </InputGroup>
  );
}

interface EditFormMultiOptionProps {
  paramField: ParamField & { type: 'multi-option' };
}

function MultiOption(props: EditFormMultiOptionProps) {
  const [searchParams] = useSearchParams();
  const { paramField } = props;
  const { id, defaultValue } = paramField;

  const optionFromParams = searchParams.getAll(id);
  const [paramState, setParamState] = useState<string[]>(optionFromParams || defaultValue || ['']);

  return (
    <>
      <input name={id} hidden readOnly value={paramState} />
      <MenuRoot isLazy closeOnSelect={false} variant='ontime-on-dark'>
        <MenuTrigger>
          <Button variant='ontime-subtle-white' position='relative' width='fit-content' fontWeight={400}>
            {paramField.title} <IoChevronDown style={{ display: 'inline' }} />
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuRadioItemGroup
          // value={paramState}
          // onChange={(value) => setParamState(Array.isArray(value) ? value : [value])}
          >
            {Object.values(paramField.values).map((option) => {
              const { value, label } = option;
              return (
                <MenuItem value={value} key={value}>
                  {label}
                </MenuItem>
              );
            })}
          </MenuRadioItemGroup>
        </MenuContent>
      </MenuRoot>
    </>
  );
}
