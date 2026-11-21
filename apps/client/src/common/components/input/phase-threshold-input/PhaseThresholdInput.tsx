import { PhaseThreshold, PhaseThresholds } from 'ontime-types';
import { defaultPhaseThresholds, parseUserTime } from 'ontime-utils';
import { FocusEvent, KeyboardEvent } from 'react';

import Select from '../../select/Select';
import Input from '../input/Input';
import TimeInput from '../time-input/TimeInput';

import style from './PhaseThresholdInput.module.scss';

const percentDefaults: Record<keyof PhaseThresholds, number> = { warning: 20, danger: 10 };

interface PhaseThresholdInputProps {
  name: string;
  /** names the inputs for assistive technology, eg: Warning */
  label: string;
  phase: keyof PhaseThresholds;
  value: PhaseThreshold;
  onChange: (value: PhaseThreshold) => void;
  disabled?: boolean;
}

export default function PhaseThresholdInput({
  name,
  label,
  phase,
  value,
  onChange,
  disabled,
}: PhaseThresholdInputProps) {
  const changeUnit = (unit: PhaseThreshold['unit'] | null) => {
    if (unit === null || unit === value.unit) return;
    onChange(unit === 'percent' ? { unit, value: percentDefaults[phase] } : defaultPhaseThresholds[phase]);
  };

  return (
    <div className={style.thresholdInput}>
      {value.unit === 'time' ? (
        <TimeInput
          id={name}
          name={name}
          time={value.value}
          disabled={disabled}
          submitHandler={(_field, newValue) => onChange({ unit: 'time', value: parseUserTime(newValue) })}
        />
      ) : (
        <PercentInput
          name={name}
          label={label}
          value={value.value}
          disabled={disabled}
          onSubmit={(newValue) => onChange({ unit: 'percent', value: newValue })}
        />
      )}
      <Select
        aria-label={`${label} unit`}
        value={value.unit}
        disabled={disabled}
        onValueChange={changeUnit}
        options={[
          { value: 'time', label: 'Before end' },
          { value: 'percent', label: '% before end' },
        ]}
      />
    </div>
  );
}

interface PercentInputProps {
  name: string;
  label: string;
  value: number;
  disabled?: boolean;
  onSubmit: (value: number) => void;
}

/**
 * Uncontrolled, the key resets the draft whenever the saved value changes
 */
function PercentInput({ name, label, value, disabled, onSubmit }: PercentInputProps) {
  const submit = (event: FocusEvent<HTMLInputElement>) => {
    const draft = event.target.value.replace('%', '').trim();
    const parsed = Number(draft);
    if (draft === '' || !Number.isFinite(parsed) || parsed < 0) {
      event.target.value = String(value);
      return;
    }
    const newValue = Math.min(parsed, 100);
    event.target.value = String(newValue);
    if (newValue !== value) onSubmit(newValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur();
    if (event.key === 'Escape') {
      event.currentTarget.value = String(value);
      event.currentTarget.blur();
    }
  };

  return (
    <Input
      key={value}
      id={name}
      aria-label={`${label} percentage`}
      data-testid={`percent-input-${name}`}
      className={style.percentInput}
      inputMode='decimal'
      defaultValue={value}
      disabled={disabled}
      onBlur={submit}
      onKeyDown={handleKeyDown}
    />
  );
}
