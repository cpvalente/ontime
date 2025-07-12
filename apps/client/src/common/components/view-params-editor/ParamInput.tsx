import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';
import Checkbox from '../checkbox/Checkbox';
import Input from '../input/input/Input';
import Select from '../select/Select';
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

    return <Select size='large' name={id} defaultValue={defaultOptionValue} options={paramField.values} />;
  }

  if (type === 'multi-option') {
    return <MultiOption paramField={paramField} />;
  }

  if (type === 'boolean') {
    return <ControlledSwitch id={id} initialValue={isStringBoolean(searchParams.get(id)) || defaultValue} />;
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
    const currentvalue = `#${searchParams.get(id) ?? defaultValue}`;

    return <InlineColourPicker name={id} value={currentvalue} />;
  }

  const defaultStringValue = searchParams.get(id) ?? defaultValue;
  const { placeholder } = paramField;

  return <Input height='large' name={id} defaultValue={defaultStringValue} placeholder={placeholder} />;
}

interface EditFormMultiOptionProps {
  paramField: ParamField & { type: 'multi-option' };
}

function MultiOption({ paramField }: EditFormMultiOptionProps) {
  const [searchParams] = useSearchParams();
  const { id, values, defaultValue = [''] } = paramField;

  const optionFromParams = searchParams.getAll(id);
  const [paramState, setParamState] = useState<string[]>(optionFromParams || defaultValue);

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
  return <Switch size='large' name={id} checked={checked} onCheckedChange={setChecked} />;
}
