import { FocusEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@chakra-ui/react';
import { millisToString } from 'ontime-utils';

import { useEmitLog } from '../../../stores/logger';
import { forgivingStringToMillis } from '../../../utils/dateConfig';
import { cx } from '../../../utils/styleUtils';

import style from './TimeInput.module.scss';
interface TimeInputProps<T extends string> {
  name: T;
  submitHandler: (field: T, value: string) => void;
  time?: number;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}

export default function TimeInput<T extends string>(props: TimeInputProps<T>) {
  const { name, submitHandler, time = 0, placeholder, disabled, className } = props;
  const { emitError } = useEmitLog();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState<string>('');
  const ignoreChange = useRef(false);

  /**
   * @description Resets input value to given
   */
  const resetValue = useCallback(() => {
    try {
      setValue(millisToString(time));
    } catch (error) {
      setValue(millisToString(0));
      emitError(`Unable to parse time ${time}: ${error}`);
    }
  }, [emitError, time]);

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
      // Check if there is anything there
      if (newValue === '') {
        return false;
      }

      // we dont know the values in the rundown, escalate to handler
      if (newValue.startsWith('p') || newValue.startsWith('+')) {
        submitHandler(name, newValue);
      }

      const valueInMillis = forgivingStringToMillis(newValue);
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
    if (time == null) return;
    resetValue();
  }, [resetValue, time]);

  const timeInputClasses = cx([style.timeInput, className, 'escapable']);

  return (
    <Input
      disabled={disabled}
      size='sm'
      ref={inputRef}
      data-testid={`time-input-${name}`}
      className={timeInputClasses}
      fontSize='1rem'
      type='text'
      placeholder={placeholder}
      variant='ontime-filled'
      onFocus={handleFocus}
      onChange={(event) => setValue(event.target.value)}
      onBlur={onBlurHandler}
      onKeyDown={onKeyDownHandler}
      value={value}
      maxLength={8}
      autoComplete='off'
    />
  );
}
