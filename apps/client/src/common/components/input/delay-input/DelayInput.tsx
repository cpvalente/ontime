import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@chakra-ui/react';

import { clamp } from '../../../utils/math';

import style from './DelayInput.module.scss';

const inputStyleProps = {
  width: 20,
  placeholder: '-',
  size: 'sm',
  color: '#E69056',
  variant: 'ontime-filled',
};

interface DelayInputProps {
  submitHandler: (value: number) => void;
  value?: number;
}

export default function DelayInput(props: DelayInputProps) {
  const { submitHandler, value = 0 } = props;
  const [_value, setValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (value == null) return;
    setValue(value);
  }, [value]);

  /**
   * @description Prepare delay value for update
   * @param {string} value string to be parsed
   */
  const validate = useCallback(
    (newValue?: string) => {
      if (newValue === '') setValue(0);
      const delayValue = clamp(Number(newValue), -60, 60);

      if (delayValue === value) return;
      setValue(delayValue);

      submitHandler(delayValue);
    },
    [submitHandler, value],
  );

  /**
   * @description Handles common keys for submit and cancel
   * @param {KeyboardEvent} event
   */
  const onKeyDownHandler = useCallback((key: string) => {
    if (key === 'Enter') {
      inputRef.current?.blur();
      validate(inputRef.current?.value);
    } else if (key === 'Escape') {
      inputRef.current?.blur();
      setValue(value);
    }
  }, [validate, value]);

  const labelText = `${Math.abs(value) !== 1 ? 'minutes' : 'minute'} ${
    value !== undefined && value >= 0 ? 'delayed' : 'ahead'
  }`;

  return (
    <label className={style.delayInput}>
      <Input
        {...inputStyleProps}
        ref={inputRef}
        data-testid='delay-input'
        className={style.inputField}
        value={_value}
        onChange={(event) => setValue(Number(event.target.value))}
        onBlur={(event) => validate(event.target.value)}
        onKeyDown={(event) => onKeyDownHandler(event.key)}
        type='number'
      />
      {labelText}
    </label>
  );
}
