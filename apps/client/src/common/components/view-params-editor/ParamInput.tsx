import { useSearchParams } from 'react-router-dom';
import { Input, InputGroup, InputLeftElement, Select, Switch, Tag } from '@chakra-ui/react';
import { chakraComponents, Select as MultiSelect } from 'chakra-react-select';

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
    const optionFromParams = (searchParams.get(id) ?? '').split(',').map((value) => {
      const selectedOption = paramField.values[value.toLocaleLowerCase()];
      if (selectedOption) {
        return { value: selectedOption.value, label: selectedOption.label, colour: selectedOption.colour };
      }
      return undefined;
    });

    //TODO:
    // const defaultOptionValue = optionFromParams || defaultValue;

    return (
      <MultiSelect
        placeholder={defaultValue ? undefined : 'Select options'}
        // variant='ontime'
        useBasicStyles
        tagVariant='solid'
        name={id}
        isMulti
        defaultValue={optionFromParams}
        options={Object.values(paramField.values)}
        components={customFieldsOptions}
        delimiter=',' //TODO: this gest turned into '%2C' for url kan we comeup with something better
      />
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

//FIXME: ???
const customFieldsOptions = {
  // @ts-expect-error: react type problems
  Option: ({ children, ...props }) => (
    // @ts-expect-error: react type problems
    <chakraComponents.Option {...props}>
      <Tag style={{ backgroundColor: props.data.colour, color: ' #101010' }}>{children}</Tag>
    </chakraComponents.Option>
  ),
  // @ts-expect-error: react type problems
  MultiValueContainer: ({ children, ...props }) => (
    // @ts-expect-error: react type problems
    <chakraComponents.MultiValueContainer {...props}>
      <Tag style={{ backgroundColor: props.data.colour, color: ' #101010' }}>{children}</Tag>
    </chakraComponents.MultiValueContainer>
  ),
};
