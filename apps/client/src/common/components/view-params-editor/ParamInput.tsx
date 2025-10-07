import { ComponentProps, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';
import Checkbox from '../checkbox/Checkbox';
import Input from '../input/input/Input';
import Select, { SelectOption } from '../select/Select';
import Switch from '../switch/Switch';

import InlineColourPicker from './InlineColourPicker';
import { ParamField } from './viewParams.types';

import style from './ParamInput.module.scss';

interface ParamInputProps {
  paramField: ParamField;
}

export default function ParamInput({ paramField }: ParamInputProps) {
  const [searchParams] = useSearchParams();
  const { id, type, defaultValue } = paramField;

  if (type === 'persist') {
    if (!paramField.values || !paramField.values.length) {
      return null;
    }
    return <input hidden name={id} readOnly value={paramField.values.join(',')} />;
  }

  if (type === 'option') {
    const optionFromParams = searchParams.get(id);
    const defaultOptionValue = optionFromParams || defaultValue;

    if (paramField.values.length === 0) {
      return <span className={style.empty}>No options available</span>;
    }

    return <ControlledSelect id={id} initialValue={defaultOptionValue} options={paramField.values} />;
  }

  if (type === 'multi-option') {
    const optionFromParams = searchParams.getAll(id);

    return (
      <MultiOption
        paramField={paramField}
        options={optionFromParams.length ? optionFromParams : paramField.defaultValue ?? ['']}
      />
    );
  }

  if (type === 'boolean') {
    return <ControlledSwitch id={id} initialValue={isStringBoolean(searchParams.get(id)) ?? defaultValue} />;
  }

  if (type === 'number') {
    const { placeholder } = paramField;
    const defaultNumberValue = searchParams.get(id) ?? defaultValue;

    return (
      <Input
        height='large'
        type='number'
        step='any'
        name={id}
        defaultValue={defaultNumberValue}
        placeholder={placeholder}
      />
    );
  }

  if (type === 'colour') {
    return <InlineColourPicker name={id} value={searchParams.get(id) ?? defaultValue} />;
  }

  const defaultStringValue = searchParams.get(id) ?? defaultValue ?? '';
  const { placeholder } = paramField;

  return <ControlledInput id={id} initialValue={defaultStringValue} placeholder={placeholder} />;
}

interface EditFormMultiOptionProps {
  paramField: ParamField & { type: 'multi-option' };
  options: string[];
}

function MultiOption({ paramField, options }: EditFormMultiOptionProps) {
  const { id, values } = paramField;
  const [paramState, setParamState] = useState<string[]>(options);

  // synchronise options
  useEffect(() => {
    setParamState(options);
  }, [options]);

  const toggleValue = (value: string, checked: boolean) => {
    if (checked) {
      setParamState((prev) => [...prev, value]);
    } else {
      setParamState((prev) => prev.filter((v) => v !== value));
    }
  };

  if (values.length === 0) {
    return <span className={style.empty}>No options available</span>;
  }

  return (
    <>
      <input name={id} hidden readOnly value={paramState.join(',')} />
      <div className={style.inline}>
        {values.map((option) => {
          return (
            <label
              key={option.value}
              className={style.toggleSelect}
              style={{
                '--user-bg': option.colour,
              }}
            >
              <Checkbox
                checked={paramState.includes(option.value)}
                onCheckedChange={(checked) => toggleValue(option.value, checked as boolean)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </>
  );
}

interface ControlledSwitchProps {
  id: string;
  initialValue: boolean;
}
function ControlledSwitch({ id, initialValue }: ControlledSwitchProps) {
  const [checked, setChecked] = useState(initialValue);

  // synchronise checked state
  useEffect(() => {
    setChecked(initialValue);
  }, [initialValue]);

  return <Switch size='large' name={id} checked={checked} onCheckedChange={setChecked} />;
}

interface ControlledSelectProps {
  id: string;
  initialValue?: string;
  options: SelectOption[];
}
function ControlledSelect({ id, initialValue, options }: ControlledSelectProps) {
  const [selected, setSelected] = useState(initialValue);

  // synchronise selected state
  useEffect(() => {
    setSelected(initialValue);
  }, [initialValue]);

  return (
    <Select size='large' name={id} options={options} value={selected} onValueChange={(value) => setSelected(value)} />
  );
}

interface ControlledInputProps<T extends number | string> extends ComponentProps<typeof Input> {
  id: string;
  initialValue: T;
}
function ControlledInput<T extends number | string>({ id, initialValue, ...inputProps }: ControlledInputProps<T>) {
  const [value, setValue] = useState(initialValue);

  // synchronise selected state
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <Input
      height='large'
      name={id}
      value={value}
      onChange={(event) => setValue(event.target.value as T)}
      {...inputProps}
    />
  );
}
