import { FocusEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { millisToString, parseUserTime } from 'ontime-utils';

import { cx } from '../../../utils/styleUtils';
import Input from '../input/Input';

import style from './TimeInput.module.scss';

interface NullableTimeInputProps<T extends string> {
  id?: T;
  name: T;
  submitHandler: (field: T, value: string) => void;
  time?: number | null;
  emptyDisplay: string;
  placeholder?: string;
  disabled?: boolean;
  align?: 'left' | 'center';
  className?: string;
}

export default function NullableTimeInput<T extends string>(props: NullableTimeInputProps<T>) {
  const { id, name, submitHandler, time, emptyDisplay, placeholder, disabled, align = 'center', className } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState<string>('');
  const ignoreChange = useRef(false);

  /**
   * @description Resets input value to given
   */
  const resetValue = useCallback(() => {
    if (typeof time !== 'number' || isNaN(time)) {
      setValue(emptyDisplay);
    } else {
      setValue(millisToString(time));
    }
  }, [emptyDisplay, time]);

  /**
   * @description Selects input text on focus
   */
  const handleFocus = useCallback(() => {
    inputRef.current?.select();
  }, []);

  /**
   * @description Submit handler
   * @param {string} newValue
   */
  const handleSubmit = useCallback(
    (newValue: string) => {
      // skip if user deleted and time is already null
      if (newValue === '' && time === null) {
        return false;
      }

      // skip if the value evaluates to the same thing
      const valueInMillis = parseUserTime(newValue);
      if (valueInMillis === time) {
        return false;
      }

      submitHandler(name, newValue);
      return true;
    },
    [name, submitHandler, time],
  );

  /**
   * @description Prepare time fields
   * @param {string} value string to be parsed
   */
  const validateAndSubmit = useCallback(
    (newValue: string) => {
      const success = handleSubmit(newValue);
      if (!success) {
        resetValue();
      }
    },
    [handleSubmit, resetValue],
  );

  /**
   * @description Handles common keys for submit and cancel
   * @param {KeyboardEvent} event
   */
  const onKeyDownHandler = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        inputRef.current?.blur();
      }
      if (event.key === 'Escape') {
        ignoreChange.current = true;
        inputRef.current?.blur();
        resetValue();
      }
    },
    [resetValue],
  );

  const onBlurHandler = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (ignoreChange.current) {
        ignoreChange.current = false;
        return;
      }
      validateAndSubmit((event.target as HTMLInputElement).value);
    },
    [validateAndSubmit],
  );

  useEffect(() => {
    resetValue();
  }, [resetValue]);

  return (
    <Input
      id={id}
      disabled={disabled}
      ref={inputRef}
      data-testid={`time-input-${name}`}
      className={cx([style.timeInput, className])}
      placeholder={placeholder}
      onFocus={handleFocus}
      onChange={(event) => setValue(event.target.value)}
      onBlur={onBlurHandler}
      onKeyDown={onKeyDownHandler}
      value={value}
      maxLength={8}
      autoComplete='off'
      style={{
        textAlign: align,
      }}
    />
  );
}
