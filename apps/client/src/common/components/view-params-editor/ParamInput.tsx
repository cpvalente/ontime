import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Select,
  Switch,
} from '@chakra-ui/react';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';

import { ParamField } from './types';

interface EditFormInputProps {
  paramField: ParamField;
}

export default function ParamInput(props: EditFormInputProps) {
  const [searchParams] = useSearchParams();
  const { paramField } = props;
  const { id, type, defaultValue } = paramField;

  const inputRef = useRef<HTMLInputElement | null>(null);

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

  if (type === 'multi-option') {
    const optionFromParams = (searchParams.get(id) ?? '').toLocaleLowerCase().split('_');
    const defaultOptionValue = optionFromParams || defaultValue?.toLocaleLowerCase().split('_');

    return (
      <>
        <input name={id} hidden ref={inputRef}></input>
        <Menu closeOnSelect={false} variant='ontime'>
          <MenuButton as={Button}>{paramField.title}</MenuButton>
          <MenuList>
            <MenuOptionGroup
              title='Select fields to display'
              type='checkbox'
              defaultValue={defaultOptionValue}
              onChange={(value) => {
                if (inputRef.current)
                  inputRef.current.value = typeof value === 'object' ? value.filter((v) => v !== '').join('_') : value;
              }}
            >
              {Object.values(paramField.values).map((option) => {
                const { value, label, colour } = option;
                return (
                  <MenuItemOption backgroundColor={colour} color='black' value={value} key={value}>
                    {label}
                  </MenuItemOption>
                );
              })}
            </MenuOptionGroup>
          </MenuList>
        </Menu>
      </>
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
      <InputGroup variant='ontime-filled'>
        {prefix && <InputLeftElement pointerEvents='none'>{prefix}</InputLeftElement>}
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

  const defaultStringValue = searchParams.get(id) ?? defaultValue;
  const { prefix, placeholder } = paramField;

  return (
    <InputGroup variant='ontime-filled'>
      {prefix && <InputLeftElement pointerEvents='none'>{prefix}</InputLeftElement>}
      <Input name={id} defaultValue={defaultStringValue} placeholder={placeholder} />
    </InputGroup>
  );
}
