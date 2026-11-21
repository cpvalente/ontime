import { PhaseThreshold } from 'ontime-types';
import { formatPhaseThreshold, parsePhaseThresholdInput } from 'ontime-utils';
import { FocusEvent, KeyboardEvent } from 'react';

import Input from '../input/Input';

import style from './PhaseThresholdInput.module.scss';

interface PhaseThresholdInputProps {
  name: string;
  label: string;
  value: PhaseThreshold;
  onChange: (value: PhaseThreshold) => void;
  disabled?: boolean;
}

/**
 * A time input which also takes a percentage of the event duration, eg: 2m or 20%
 * Uncontrolled, the key resets the draft whenever the saved value changes
 */
export default function PhaseThresholdInput({ name, label, value, onChange, disabled }: PhaseThresholdInputProps) {
  const shown = formatPhaseThreshold(value);

  const submit = (event: FocusEvent<HTMLInputElement>) => {
    const parsed = parsePhaseThresholdInput(event.target.value);
    if (!parsed) {
      event.target.value = shown;
      return;
    }
    const formatted = formatPhaseThreshold(parsed);
    event.target.value = formatted;
    if (formatted !== shown) onChange(parsed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // the input can sit in a form or a modal, which should not see these keys
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.currentTarget.value = shown;
      event.currentTarget.blur();
    }
  };

  return (
    <Input
      key={shown}
      id={name}
      aria-label={label}
      className={style.thresholdInput}
      defaultValue={shown}
      disabled={disabled}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={submit}
      onKeyDown={handleKeyDown}
    />
  );
}
